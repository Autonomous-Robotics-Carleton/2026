#!/usr/bin/env bash
# Build (cached) and start the simulator.
#   ./run.sh           headless
#   ./run.sh --bridge  for the ground station: bridge on 127.0.0.1:8765, car_link on 127.0.0.1:9870/udp
#   ./run.sh --gui3d   Gazebo 3D GUI in your browser via noVNC (http://localhost:6080); CPU-heavy
# Add --track <name> for a bundled track (src/arc_sim/tracks/<name>.yaml) or
# --track <path/to/map.yaml> for your own; its image must sit in the same directory.
set -euo pipefail
cd "$(dirname "$0")"

usage="usage: $0 [--bridge | --gui3d] [--track <name | map.yaml>]"
mode=""
track_args=()
while [ $# -gt 0 ]; do
  case "$1" in
    --bridge) mode=bridge ;;
    --gui3d) mode=3d ;;
    --track)
      [ $# -ge 2 ] || { echo "$usage" >&2; exit 2; }
      if [ -f "$2" ]; then
        # Mount the map's directory read-only; the yaml names its image relative to itself.
        dir="$(cd "$(dirname "$2")" && pwd)"
        track_args=(-v "$dir:/tracks:ro" -e TRACK="/tracks/$(basename "$2")")
      elif [ -f "src/arc_sim/tracks/$2.yaml" ]; then
        track_args=(-e TRACK="$2")
      else
        echo "No track '$2': not a file, and not one of: $(cd src/arc_sim/tracks && ls *.yaml | sed 's/\.yaml$//' | tr '\n' ' ')" >&2
        exit 2
      fi
      shift ;;
    *) echo "$usage" >&2; exit 2 ;;
  esac
  shift
done

if ! docker info >/dev/null 2>&1; then
  echo "Docker isn't running. Start Docker Desktop and try again." >&2
  exit 1
fi

if [ -n "$(docker ps -aq -f name=^arc-sim$)" ]; then
  echo "An arc-sim container already exists. Stop it first: docker stop arc-sim" >&2
  exit 1
fi

echo "Building arc-sim (cached after the first time)..."
docker build -q -t arc-sim . >/dev/null

if [ -z "$mode" ]; then
  exec docker run --rm --name arc-sim ${track_args[@]+"${track_args[@]}"} arc-sim
fi

# Ports are bound to this machine only; nothing on them has a password.
if [ "$mode" = bridge ]; then
  docker run --rm --name arc-sim ${track_args[@]+"${track_args[@]}"} -e BRIDGE=1 \
    -p 127.0.0.1:8765:8765 -p 127.0.0.1:9870:9870/udp arc-sim &
  probe="http://localhost:8765/track.json"
else
  docker run --rm --name arc-sim ${track_args[@]+"${track_args[@]}"} -e GUI=3d -p 127.0.0.1:6080:6080 arc-sim &
  probe="http://localhost:6080/vnc.html"
fi
sim=$!
# Stop the container on Ctrl+C, or when the ground station terminates this script.
trap 'docker stop arc-sim >/dev/null 2>&1; wait "$sim" 2>/dev/null' INT TERM

up=""
for _ in $(seq 60); do
  curl -sf -o /dev/null "$probe" && { up=1; break; }
  kill -0 "$sim" 2>/dev/null || break
  sleep 1
done
if [ -z "$up" ]; then
  echo "Not up yet: $probe" >&2
elif [ "$mode" = bridge ]; then
  echo "Bridge ready: http://localhost:8765/track.json, ws://localhost:8765/ws; car_link: udp://127.0.0.1:9870"
else
  url="http://localhost:6080/vnc.html?autoconnect=1&resize=scale"
  echo "Viewer: $url"
  open "$url" 2>/dev/null || true
fi
wait "$sim"
