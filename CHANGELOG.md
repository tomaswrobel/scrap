# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2023-11-05

### Added

- SB3 file compatibility (experimental, about 20 % so far)
- `ifOnEdgeBounce` block

## Changed

- prism-code-editor update
- scrap-engine update

## [2.9.5] - 2023-11-03

### Changed

- Sass update
- File structure

### Added

- Work on Scrap 3.0.0 has begun.
- SB3 file compatibility will be added in Scrap 3.0.0.

## [2.9.4] - 2023-11-01

### Fixed

- dependencies update

## [2.9.3] - 2023-10-24

### Fixed

- Variables in for loop are not rewritten anymore.

## [2.9.2] - 2023-10-03

### Fixed

- dependencies update

## [2.9.1] - 2023-10-02

### Fixed

- spread operator

## [2.9.0] - 2023-10-02

### Added

- Show / hide variables

## [2.8.4] - 2023-09-28

### Changed

- Update Blockly to 10.2.0

## [2.8.3] - 2023-09-28

### Changed

- Engine update
- Loop protection

### Fixed

- Current costume now saves correctly.

## [2.8.2] - 2023-09-27

### Fixed

- README.md links

### Added

- Media list can now delete items.

## [2.8.1] - 2023-09-26

### Added

- 256x256 icon

### Changed

- Icon color

## [2.8.0] - 2023-09-26

### Added

- PWA support (service worker, manifest, icons)
- File Handler API

## [2.7.1] - 2023-09-26

### Fixed

- Stop functionality for events

## [2.7.0] - 2023-09-25

### Added

- Stage now can emit sounds.
- Volume can be set for sounds.
- Pen size and Pen color getters.
- Turbo mode getter
- Volume & Pen size can be observed from another sprite.

### Changed

- Engine update
- Gap added between many blocks to improve readability.
- Many blocks in flyout have now specific field values.

### Fixed

- Images in media list are no longer stretched.
- Packages update

## [2.6.5] - 2023-09-24

### Fixed

- bind decorator

## [2.6.4] - 2023-09-24

### Fixed

- unary minus operator
- engine update

### Added

- bind decorator
- unary plus operator
- conversion to number

## [2.6.3] - 2023-09-22

### Fixed

- color parameter fix
- engine udate
- worker's fixes

## Added

- stop functionality

## [2.6.2] - 2023-09-19

### Fixed

- engine version in README.md
- navbar width
- code prefix in the generated code

## [2.6.1] - 2023-09-19

### Fixed

- `stamp` block now works correctly.

### Changed

- engine update

## [2.6.0] - 2023-09-17

### Added

- `stamp` block.

### Changed

- gap is now SCSS variable.
- background color is now slightly darker.

### Fixed

- workspace deletion does not occur anymore

## [2.5.0] - 2023-09-17

### Added

- `goBack`, `goForward` and `goTo` blocks.

### Changed

- engine update

## [2.4.3] - 2023-09-17

### Fixed

- `buffer` 6.0.1 &rarr; 6.0.3 

## [2.4.2] - 2023-09-17

### Added

- GitHub's dependabot is now enabled.

### Fixed

- `array` block now preserves connections.

## [2.4.1] - 2023-09-17

### Fixed

- field_param now responds to the change of the field's value.
- field_param crashes in rare cases. (This was caused by super.updateSize_().)

### Added

- Some more documentation.
- Context menu for `foreach` to rename the variable.

## [2.4.0] - 2023-09-16

### Changed

- Dependencies update
- Instead of string interpolation, `path.join` is now used to join paths.
- Primary color is now green (the same as on my website).
- Main script is now separated from the `app` file.
- GitHub action - release job is no longer dependent on the deploy job.

### Fixed

- When switching sprites, the JavaScript / Blocks tab now changes.

## [2.3.2] - 2023-09-16

### Fixed

- Icons are now correctly displayed in the PNG export.

## [2.3.1] - 2023-09-16

### Fixed

- Fixed data URLs by migrating to UTF-8 encoding. (`btoa` &rarr; `encodeURIComponent`)

### Added

- do ... while loop block

## [2.3.0] - 2023-09-16

### Added

- You can export PNG images of blocks.

### Changed

- Naked values are not included in the generated code.

## [2.2.0] - 2023-09-15

### Fixed

- RELEASE_HEADER.md &rarr; RELEASE_HEAD.md

### Added

- Added hex validation to the string field in case of color input.
- Connection Checker now allows to connect Color and String blocks.
- About dialog added.

### Removed

- Removed the `hex` block.

## [2.1.0] - 2023-09-15

### Changed

- "Code" tab is now called "JavaScript".
- Release note header is now smaller.

## Added

- RELEASE_HEADER.md file is now included in releases.

## [2.0.2] - 2023-09-14

### Fixed

- Releases now correctly include the CHANGELOG.md file.

### Changed

- Paint Editor's buttons Save & Cancel have now smaller font size.

## [2.0.1] - 2023-09-14

### Fixed

- CHANGELOG.md links

### Changed

- When deploy fails, the release is not created.
- Release now includes only fragments of the CHANGELOG.md file.

## [2.0.0] - 2023-09-14

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

[unreleased]: https://github.com/tomas-wrobel/scrap/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v3.0.0
[2.9.5]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.9.5
[2.9.4]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.9.4
[2.9.3]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.9.3
[2.9.2]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.9.2
[2.9.1]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.9.1
[2.9.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.9.0
[2.8.4]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.8.4
[2.8.3]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.8.3
[2.8.2]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.8.2
[2.8.1]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.8.1
[2.8.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.8.0
[2.7.1]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.7.1
[2.7.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.7.0
[2.6.5]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.6.5
[2.6.4]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.6.4
[2.6.3]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.6.3
[2.6.2]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.6.2
[2.6.1]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.6.1
[2.6.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.6.0
[2.5.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.5.0
[2.4.3]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.4.3
[2.4.2]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.4.2
[2.4.1]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.4.1
[2.4.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.4.0
[2.3.2]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.3.2
[2.3.1]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.3.1
[2.3.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.3.0
[2.2.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.2.0
[2.1.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.1.0
[2.1.1]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.1.1
[2.0.2]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.0.2
[2.0.1]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.0.1
[2.0.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v2.0.0