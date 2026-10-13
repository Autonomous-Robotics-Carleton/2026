# ground-station

The operator's app for driving the car, or the simulator standing in for it. It runs natively on your laptop (macOS or Linux), not in Docker and never on the car: Python 3 and a plain HTML/JS page in your browser.

## Run

```bash
./run.sh                       # real mode: looks for the car at config.json car.host
./run.sh --car 192.168.1.50    # override car.host
./run.sh --track oval          # sim track used when you switch to the simulator
```

`run.sh` creates `.venv` and installs `requirements.txt` the first time (and again only when it changes), starts `server.py` and `helper.py`, and opens `http://localhost:8080/`. Ctrl+C stops both, and the simulator if the ground station started it. Both listen on this machine only and have no password.

Switching to the simulator needs Docker Desktop running, as for [`simulator/`](../simulator/README.md).

## How it connects

Two processes, two paths to the car. The full contract is [`protocol.md`](protocol.md).

```
page ──ws :8081──▶ helper.py ──UDP :9870──▶ car_link   heartbeat + teleop, 50 Hz
page ──ws :8080──▶ server.py ──ws :8765──▶ bridge     state, track, link status
```

- **`server.py`** (`:8080`) serves the page and relays the bridge's state to it, unchanged, along with which mode it's in and whether it's connected. It proxies the track image at `/track.png`.
- **`helper.py`** (`:8081`) sends UDP to car_link: heartbeats, and the page's teleop. The page tells it where (the server's `udp` address). Packets are marked DSCP EF.

`config.json` holds the car's address and the ports: `car.host` (the car's bridge and car_link), `sim.host` (the simulator, `127.0.0.1`), and `sim.track` (default track). `--car` and `--track` override them.

## Sim and real

- **Real** (at startup): the server connects to the car's bridge at `car.host`, retrying every 2 s.
- **Sim**: the page's switch makes the server start `../simulator/run.sh --bridge --track <track>`, wait until its bridge answers on `127.0.0.1:8765`, and connect. The first start builds the sim image, which takes a while. If an `arc-sim` container is already running, the server says so in its log and uses it. The page's track menu lists `simulator/src/arc_sim/tracks/*.yaml`; a custom map can only be the default, through `--track <path>`. Switching back to real stops the simulator (`docker stop arc-sim` if `run.sh` didn't).

In sim mode the server keeps looking for the car in the background, so the page can say a live car was found. It never switches by itself.

## Heartbeat chain

The car moves only while heartbeats keep arriving, end to end: the page sends one to the helper every 50 ms, and the helper sends UDP heartbeats at 50 Hz only while the page's are fresh (within 0.15 s). If the page stops, the helper stops, and car_link stops the car after 0.15 s without a heartbeat (SYS-04).

So hiding the tab, closing it or putting the laptop to sleep stops the car. That is intended: browsers throttle hidden tabs, and a page you can't see shouldn't be driving.

Teleop is sent only while the page's heartbeats are fresh and a teleop message arrived within 0.15 s; otherwise the helper sends none and car_link's teleop timeout stops the car.

If several pages are open, a heartbeat from any of them counts, and the latest target, teleop and cutoff from any of them apply.

**Test heartbeat cutoff** (on the page) makes the helper stop sending heartbeats while teleop continues, so you can watch the car's own heartbeat gate stop it. The helper reports what it sent to the page at 5 Hz.

## Not built yet

- Take control, a driver-lost broadcast, and ownership of the car between several ground stations.
- The car side: the real car has no bridge or car_link yet, so real mode shows no car. `car.host` is TBD (`null`).
- The UDP packet format and ports are provisional (TBC) until the car's teleop receiver is recorded in [`systems/`](../systems/README.md).

## Layout

| Path | What |
| --- | --- |
| `run.sh` | Starts both processes; `--track`, `--car` |
| `server.py` | Page, `/track.png` proxy, bridge relay, sim start/stop |
| `helper.py` | Page heartbeat and teleop → UDP to car_link |
| `config.json` | Car address (TBD), sim address, ports, default track |
| `web/index.html` | The page |
| `protocol.md` | Messages and packets between all of the above |

For testing, `ARC_GS_SIM_RUN=<script>` makes the server run that script instead of `../simulator/run.sh`, with the same arguments.
