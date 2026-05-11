"""Architecture test conftest.

``_deferred/`` contains tests ported verbatim from AISALESHT that depend
on ``src.modules.*`` paths not yet available in luana-platform.  They are
excluded from collection and serve as an audit trail of what still needs
migration when the corresponding packages are lifted.
"""

collect_ignore_glob = ["_deferred/*"]
