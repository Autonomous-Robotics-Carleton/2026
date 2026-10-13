#!/usr/bin/env python3
"""The sim's bridge to the ground station: track files over HTTP, car state over a websocket.

http://<host>:<port>/track.json  the track's placement, or null with no track
http://<host>:<port>/track.png   the track's walls: opaque where occupied, faint where unknown
ws://<host>:<port>/ws            JSON at 30 Hz, the `state` message in ground-station/protocol.md

estimate is the car's own odometry (/sim/odom). Odometry starts at zero at the spawn pose,
so it is moved by the `start` parameter into the world frame before it is sent. truth is
Gazebo's actual pose (/sim/ground_truth), which only the sim has. link is car_link's latest
/sim/link/status. The page itself is served by the ground station, not here.
"""

import asyncio
import io
import json
import math
import threading
from http import HTTPStatus

import numpy as np
import rclpy
import websockets
from nav_msgs.msg import Odometry
from PIL import Image
from rclpy.node import Node
from std_msgs.msg import String

from arc_sim import track as tracks


def pose2d(msg):
    p, q = msg.pose.pose.position, msg.pose.pose.orientation
    yaw = math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z))
    return {'x': p.x, 'y': p.y, 'yaw': yaw}


class Bridge(Node):

    def __init__(self):
        super().__init__('bridge')
        self.port = self.declare_parameter('port', 8765).value
        self.rate = self.declare_parameter('rate', 30.0).value
        self.track = self.declare_parameter('track', '').value
        self.start = self.declare_parameter('start', [0.0, 0.0, 0.0]).value
        self.state = {'type': 'state', 'source': 'sim', 'estimate': None, 'truth': None, 'link': None}
        self.create_subscription(Odometry, '/sim/ground_truth', self.on_truth, 10)
        self.create_subscription(Odometry, '/sim/odom', self.on_odom, 10)
        self.create_subscription(String, '/sim/link/status', self.on_link, 10)

    def on_truth(self, msg):
        self.state['truth'] = pose2d(msg)

    def on_odom(self, msg):
        p = pose2d(msg)
        sx, sy, syaw = self.start
        c, s = math.cos(syaw), math.sin(syaw)
        self.state['estimate'] = {'x': sx + c * p['x'] - s * p['y'], 'y': sy + s * p['x'] + c * p['y'],
                                  'yaw': p['yaw'] + syaw}

    def on_link(self, msg):
        try:
            self.state['link'] = json.loads(msg.data)
        except ValueError:
            self.get_logger().warn('Unparseable /sim/link/status: %r' % msg.data)


def track_files(path):
    """(track.json, track.png) bodies. The png is an alpha mask the page tints."""
    if not path:
        return b'null', None
    t = tracks.load(path)
    alpha = np.where(t.occupied, 255, np.where(t.unknown, 40, 0)).astype(np.uint8)
    rgba = np.zeros(alpha.shape + (4,), np.uint8)
    rgba[..., 3] = alpha
    png = io.BytesIO()
    Image.fromarray(rgba, 'RGBA').save(png, 'PNG')
    meta = {'name': t.name, 'resolution': t.resolution, 'origin': t.origin,
            'width': alpha.shape[1], 'height': alpha.shape[0]}
    return json.dumps(meta).encode(), png.getvalue()


async def serve(node):
    track_json, track_png = track_files(node.track)
    clients = set()

    async def process_request(path, headers):
        if path == '/ws':
            return None  # continue the websocket handshake
        if path == '/track.json':
            return HTTPStatus.OK, [('Content-Type', 'application/json')], track_json
        if path == '/track.png' and track_png:
            return HTTPStatus.OK, [('Content-Type', 'image/png')], track_png
        return HTTPStatus.NOT_FOUND, [], b'not found\n'

    async def handler(ws, path=None):
        clients.add(ws)
        try:
            await ws.wait_closed()
        finally:
            clients.discard(ws)

    async with websockets.serve(handler, '0.0.0.0', node.port, process_request=process_request):
        node.get_logger().info('Bridge on port %d' % node.port)
        while rclpy.ok():
            if clients:
                websockets.broadcast(clients, json.dumps(node.state))
            await asyncio.sleep(1.0 / node.rate)


def main():
    rclpy.init()
    node = Bridge()
    threading.Thread(target=rclpy.spin, args=(node,), daemon=True).start()
    try:
        asyncio.run(serve(node))
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.try_shutdown()


if __name__ == '__main__':
    main()
