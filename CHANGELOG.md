# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.3.1] - 2022-09-16

### Fixed

- Fixed data URLs by migrating to UTF-8 encoding. (`btoa` &rarr; `encodeURIComponent`)

### Added

- do ... while loop block

## [2.3.0] - 2022-09-16

### Added

- You can export PNG images of blocks.

### Changed

- Naked values are not included in the generated code.

## [2.2.0] - 2022-09-15

### Fixed

- RELEASE_HEADER.md &rarr; RELEASE_HEAD.md

### Added

- Added hex validation to the string field in case of color input.
- Connection Checker now allows to connect Color and String blocks.
- About dialog added.

### Removed

- Removed the `hex` block.

## [2.1.0] - 2022-09-15

### Changed

- "Code" tab is now called "JavaScript".
- Release note header is now smaller.

## Added

- RELEASE_HEADER.md file is now included in releases.

## [2.0.2] - 2022-09-14

### Fixed

- Releases now correctly include the CHANGELOG.md file.

### Changed

- Paint Editor's buttons Save & Cancel have now smaller font size.

## [2.0.1] - 2022-09-14

### Fixed

- CHANGELOG.md links

### Changed

- When deploy fails, the release is not created.
- Release now includes only fragments of the CHANGELOG.md file.

## [2.0.0] - 2022-09-14

### Added

- Sprites can now be renamed.
- Added a direction getter for sprites.
- JSDoc array types are now supported.
- Release GitHub action.

### Fixed

- Fixed a bug where the `say` block would not work properly.

### Changed

- Engine update
- `say` and `think` blocks now accept any type of input.

### Removed

- Reserved words are no longer in Generator's constructor.

[unreleased]: https://github.com/tomas-wrobel/scrap/compare/v2.3.1...HEAD
[2.3.1]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.3.1
[2.3.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.3.0
[2.2.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.2.0
[2.1.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.1.0
[2.1.1]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.1.1
[2.0.2]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.0.2
[2.0.1]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.0.1
[2.0.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.0.0