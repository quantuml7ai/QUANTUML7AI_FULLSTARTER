def rollback_target(active_manifest, known_releases):
    rid=active_manifest.get("rollbackReleaseId")
    if not rid: raise ValueError("rollback_release_missing")
    if rid not in known_releases: raise ValueError("rollback_release_unknown")
    return known_releases[rid]
