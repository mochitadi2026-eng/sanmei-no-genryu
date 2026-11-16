#!/usr/bin/env python3
"""Reproduce the 2026 apparent geocentric solar longitude crossing times.

Requires: pip install pyswisseph
Uses Swiss Ephemeris' Moshier analytic backend (FLG_MOSEPH), not JPL DE files.
This is an independent numerical experiment, not a definitive civil-calendar service.
"""
from datetime import datetime, timezone, timedelta
import swisseph as swe

CASES = [
    ((2026, 3, 20), 0, "spring equinox"),
    ((2026, 6, 21), 90, "summer solstice"),
    ((2026, 9, 23), 180, "autumn equinox"),
    ((2026, 12, 21), 270, "winter solstice"),
]

def longitude(jd):
    xx, flag = swe.calc_ut(jd, swe.SUN, swe.FLG_MOSEPH | swe.FLG_SPEED)
    if not (flag & swe.FLG_MOSEPH):
        raise RuntimeError(f"Unexpected ephemeris backend flags: {flag}")
    return xx[0]

def crossing(day, target):
    jd = swe.julday(*day, 0)
    lo, hi = jd - 2, jd + 2
    def delta(j):
        return ((longitude(j) - target + 180) % 360) - 180
    if delta(lo) * delta(hi) >= 0:
        raise ValueError("Longitude crossing is not bracketed")
    for _ in range(55):
        mid = (lo + hi) / 2
        if delta(lo) * delta(mid) <= 0:
            hi = mid
        else:
            lo = mid
    utc = datetime(*day, tzinfo=timezone.utc) + timedelta(days=(lo + hi) / 2 - jd)
    return utc

if __name__ == "__main__":
    print("pyswisseph", swe.version, "backend=Moshier, apparent geocentric tropical longitude, UTC")
    for day, target, name in CASES:
        utc = crossing(day, target)
        print(name, f"{target} deg", utc.isoformat(timespec="seconds"),
              "JST", utc.astimezone(timezone(timedelta(hours=9))).isoformat(timespec="seconds"))
