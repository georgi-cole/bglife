"""Pack the playable HTML, source project and compiled web build into a portable ZIP."""
import argparse
from pathlib import Path
from shutil import copyfile
from zipfile import ZIP_DEFLATED, ZipFile


def main():
    project = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("destination", type=Path, nargs="?", default=project / "release")
    destination = parser.parse_args().destination.resolve()
    destination.mkdir(parents=True, exist_ok=True)
    standalone = project / "release" / "BgLife-Playable.html"
    built_index = project / "dist" / "index.html"
    if not standalone.is_file() or not built_index.is_file():
        parser.error("Run npm run build before packaging.")
    source_names = [
        ".gitignore", "README.md", "capacitor.config.ts", "index.html",
        "package.json", "package-lock.json", "tsconfig.json"
    ]
    sources = [project / filename for filename in source_names]
    for folder in ["scripts", "src", "public", "tests", "dist"]:
        sources.extend(sorted(p for p in (project / folder).rglob("*")
                              if p.is_file() and "__pycache__" not in p.parts))
    archive = destination / "BgLife-First-Chapter.zip"
    with ZipFile(archive, "w", ZIP_DEFLATED) as package:
        package.write(standalone, "BgLife-Playable.html")
        for source in sources:
            package.write(source, "BgLife/" + source.relative_to(project).as_posix())
    with ZipFile(archive) as package:
        failed_member = package.testzip()
        if failed_member is not None:
            raise RuntimeError("Archive validation failed for " + failed_member)
        if package.read("BgLife-Playable.html") != standalone.read_bytes():
            raise RuntimeError("Archived playable HTML does not match the build.")
    direct = destination / standalone.name
    if direct != standalone:
        copyfile(standalone, direct)
    print(archive)
    print(direct)


if __name__ == "__main__":
    main()
