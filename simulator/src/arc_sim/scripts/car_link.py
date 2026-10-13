#!/usr/bin/env python3
"""The sim's stand-in for the car's receiving end: heartbeat watchdog and teleop receiver.

Implements car_link in ground-station/protocol.md. The ground station's helper sends
25-byte UDP packets (`<4sBIdff`: magic, type, seq, t, speed, steer) to port 9870:
heartbeats and teleop, each at 50 Hz. Algorithms drive through /sim/auto/cmd_vel.

- No heartbeat for heartbeat_timeout: every source is overridden and the car stops.
- No teleop for teleop_timeout (heartbeat alive): teleop counts as zero speed.
- Teleop wins over /sim/auto/cmd_vel while fresh; both are gated by the heartbeat.
- Speed moves toward its target at no more than `decel` m/s^2, so a stop is a ramp,
  not a wall. Curvature holds its last value while braking, so the car keeps its line.

Publishes /sim/cmd_vel at `rate` Hz and /sim/link/status (JSON) at 10 Hz. Both timers run
on the wall clock (this node doesn't use sim time), so they still fire if sim time stalls.
"""

import json
import math
import socket
import struct
import time

import rclpy
from geometry_msgs.msg import Twist
from rclpy.node import Node
from std_msgs.msg import String

PACKET = struct.Struct('<4sBIdff')
MAGIC = b'ARC0'
HEARTBEAT, TELEOP = 1, 2


def newer(seq, last):
    """Wrap-aware: seq is ahead of last by less than half the u32 range."""
    return last is None or 0 < (seq - last) % 2**32 < 2**31


class CarLink(Node):

    def __init__(self):
        super().__init__('car_link')
        self.port = self.declare_parameter('port', 9870).value
        self.hb_timeout = self.declare_parameter('heartbeat_timeout', 0.15).value
        self.teleop_timeout = self.declare_parameter('teleop_timeout', 0.15).value
        self.decel = self.declare_parameter('decel', 5.0).value
        self.wheelbase = self.declare_parameter('wheelbase', 0.3302).value
        self.steer_limit = self.declare_parameter('steering_limit', 0.4189).value
        rate = self.declare_parameter('rate', 50.0).value

        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock.bind(('0.0.0.0', self.port))
        self.sock.setblocking(False)

        self.seq = {HEARTBEAT: None, TELEOP: None}
        self.hb_time = None      # monotonic receipt time of the last accepted packet
        self.teleop_time = None
        self.teleop = (0.0, 0.0)  # speed, steer
        self.auto_time = None
        self.auto = Twist()

        self.speed = 0.0
        self.curvature = 0.0
        self.reason = 'idle'
        self.last_tick = time.monotonic()

        self.pub = self.create_publisher(Twist, '/sim/cmd_vel', 10)
        self.status_pub = self.create_publisher(String, '/sim/link/status', 10)
        self.create_subscription(Twist, '/sim/auto/cmd_vel', self.on_auto, 10)
        self.create_timer(1.0 / rate, self.tick)
        self.create_timer(0.1, self.publish_status)
        self.get_logger().info('car_link listening on UDP %d' % self.port)

    def on_auto(self, msg):
        self.auto_time = time.monotonic()
        self.auto = msg

    def receive(self, now):
        """Drain every pending packet; keep only valid, newer ones."""
        while True:
            try:
                data = self.sock.recv(64)
            except BlockingIOError:
                return
            if len(data) != PACKET.size:
                continue
            magic, kind, seq, _t, speed, steer = PACKET.unpack(data)
            if magic != MAGIC or kind not in self.seq or not newer(seq, self.seq[kind]):
                continue
            if not (math.isfinite(speed) and math.isfinite(steer)):
                continue
            self.seq[kind] = seq
            if kind == HEARTBEAT:
                self.hb_time = now
            else:
                self.teleop_time = now
                self.teleop = (speed, steer)

    def fresh(self, stamp, timeout, now):
        return stamp is not None and now - stamp <= timeout

    def target(self, now):
        """(reason, target speed, curvature or None to hold the last one)."""
        if self.hb_time is None and self.teleop_time is None:
            return 'idle', 0.0, None
        if not self.fresh(self.hb_time, self.hb_timeout, now):
            return 'heartbeat', 0.0, None
        if self.fresh(self.teleop_time, self.teleop_timeout, now):
            speed, steer = self.teleop
            steer = max(-self.steer_limit, min(self.steer_limit, steer))
            return 'ok', speed, math.tan(steer) / self.wheelbase
        # An algorithm that goes silent is stopped like teleop (protocol.md gives it no timeout).
        if self.fresh(self.auto_time, self.teleop_timeout, now):
            v, w = self.auto.linear.x, self.auto.angular.z
            return 'ok', v, (w / v if abs(v) > 1e-3 else None)
        return 'teleop', 0.0, None

    def tick(self):
        now = time.monotonic()
        dt = min(now - self.last_tick, 0.1)
        self.last_tick = now
        self.receive(now)

        reason, target, curvature = self.target(now)
        if reason != self.reason:
            if reason == 'ok':
                self.get_logger().info('Link ok: driving')
            elif self.reason == 'ok':
                self.get_logger().warn('Stopping: %s' % {
                    'heartbeat': 'no heartbeat for %.2f s' % self.hb_timeout,
                    'teleop': 'no teleop for %.2f s' % self.teleop_timeout,
                    'idle': 'nothing received'}[reason])
            self.reason = reason
        if curvature is not None:
            self.curvature = curvature

        step = self.decel * dt
        self.speed += max(-step, min(step, target - self.speed))
        msg = Twist()
        msg.linear.x = self.speed
        msg.angular.z = self.speed * self.curvature
        self.pub.publish(msg)

    def publish_status(self):
        now = time.monotonic()

        def age(stamp):
            return None if stamp is None else round(now - stamp, 3)

        self.status_pub.publish(String(data=json.dumps({
            'heartbeat_age': age(self.hb_time),
            'teleop_age': age(self.teleop_time),
            'stopping': self.reason != 'ok',
            'reason': self.reason,
        })))


def main():
    rclpy.init()
    node = CarLink()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.try_shutdown()


if __name__ == '__main__':
    main()
