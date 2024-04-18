# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.2.0] - 2024-4-18

### Fixed

- Monaco Editor
- RELEASE_HEAD.md

## [4.1.0] - 2024-4-18

### Changed

- File format now checks the version of Scrap
- Parley.js style and animation
- Project name

### Added

- `app.Check` & `app.Variable` types

### Fixed

- Importing projects

## [4.0.0] - 2024-4-17

### Added

- Scrap now uses TypeScript instead of JavaScript
- Scrap now ships with Monaco Editor, supporting:
    - TypeScript intellisense
        - Scrap does not use the default implementation:
            - to align with TypeScript version
            - to allow some modifications (e.g. lib.d.ts)
    - color pickers
    - colorization identical to the blocks
- script variables (`let`, `var` and `const`)

### Changed

- engine version
- file structure

## [3.6.0] - 2023-11-16

### Fixed

- When transforming JS to blocks, the `tryCatch` block no longer ignores the try block.
- Many problems with variables, parameters and its encodings
- Collecting types of global variables

### Added

- Mutator for `parameter` block so it can store the type of the parameter.
- Dialogs blocks - `prompt`, `alert`, `confirm`
- Partial support for Scratch's `control_stop` block

### Changed

- File structure (utils.ts in `files` folder)

### Removed

- `getVariable` block was removed in favor of `parameter` block.

## [3.5.0] - 2023-11-12

### Fixed

- Paint Editor now displays stage as it is displayed in the output
- Many accessibilty issues
- Scrap Engine update - point in direction now works correctly.
- SB3 compatibility - `setRotationStyle` block now works correctly.
- README.md note for end users

## Added

- Styling of color & range input in Paint Editor
- Select tool in Paint Editor
- Paint editor now allows you to move shapes you have drawn.
- Some comments
- PWA can now handles SB3 files.

## Changed

- The way how triangles are drawn in Paint Editor

## [3.4.1] - 2023-11-11

## Fixed

- backdrop / costume accessors now work correctly.
- conversion from JS to blocks now handles variables correctly.

## Added

- User can now export the project with CDN links to Scrap Engine, minimizing the size of the project.

## [3.4.0] - 2023-11-11

### Fixed

- When mixing blocks & code, global variables are now correctly handled (via parsing the code)
- Ask block now uses variable correctly.
- Global variables bugs
- Escaping Scrap names did not work correctly in many cases.
- Await is now added to event handlers. Historically, Scrap Engine did not have await in event handlers, but it was added in v1.
- Scrap 3 has been really unstable, and this release changes that. (I hope so.)

### Changed

- Scratch's classic fields are no longer treated as strings, since they can be numbers as well.
- SB3 compatibility lives in one file now. The typings were moved to the `SB3` namespace / class.
- Scrap Engine update

### Added

- Scratch's procedures are now FULLY supported.
- A lot of comments to make the code more readable. (I'm sorry for the mess, but I'm not used to writing comments. If you have any problems understanding the code, please let me know.)
- VS Code settings for comments in JSON files.
- README.md now acknowledges the fact that Scrap does not use Scratch's code at all. (It is not a fork of Scratch.)

### Removed

- function's label field - this was a historical thing, since Scrap v1 did support generators and it was used to distinguish between generators and functions.

## [3.3.0] - 2023-11-10

### Added

- `join` block
- Much better SB3 compatibility (variables, operators, etc.)

### Changed

- Variables are no longer stored in Blockly workspace
- Blockly extensions live in a separate folder now

### Fixed

- Unknown blocks are now correctly shaped
- `think` block now accepts any type of input

## [3.2.1] - 2023-11-10

### Changed

- variables and entities no longer require valid identifiers (e.g. `1` is now a valid variable name)

## [3.2.0] - 2023-11-09

### Added

- global variables
- much higher SB3 compatibility

### Fixed

- `return` block no longer disconnects the value if it is type-compatible.

### Changed

- Instead of throwing an error, SB3 compatibility manner fills the missing blocks with `unknown` blocks.

## [3.1.2] - 2023-11-09

### Added

- `when timer > ` block

## [3.1.1] - 2023-11-07

### Added

- timer, reset timer blocks
- more SB3 blocks

### Fixed

- better acessibility
- engine update
- other dependencies update

## [3.1.0] - 2023-11-07

### Added

- Support for more SB3 blocks
- Date blocks
    - You can use them in JS (via `new Date()`)
    - Now, there is a `Date` type in Scrap
- A lot of comments

## [3.0.2] - 2023-11-06

### Changed

- OOP inside the SB3 support
- `clone` block now accepts a sprite as an argument

## [3.0.1] - 2023-11-06

### Fixed

- if...else block compatibility with SB3 files

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

[unreleased]: https://github.com/tomas-wrobel/scrap/compare/v4.2.0...HEAD
[4.2.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v4.2.0
[4.1.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v4.1.0
[4.0.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v4.0.0
[3.6.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v3.6.0
[3.5.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v3.5.0
[3.4.2]: https://github.com/tomas-wrobel/scrap/releases/tag/v3.4.2
[3.4.1]: https://github.com/tomas-wrobel/scrap/releases/tag/v3.4.1
[3.4.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v3.4.0
[3.3.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v3.3.0
[3.2.1]: https://github.com/tomas-wrobel/scrap/releases/tag/v3.2.1
[3.2.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v3.2.0
[3.1.2]: https://github.com/tomas-wrobel/scrap/releases/tag/v3.1.2
[3.1.1]: https://github.com/tomas-wrobel/scrap/releases/tag/v3.1.1
[3.1.0]: https://github.com/tomas-wrobel/scrap/releases/tag/v3.1.0
[3.0.2]: https://github.com/tomas-wrobel/scrap/releases/tag/v3.0.2
[3.0.1]: https://github.com/tomas-wrobel/scrap/releases/tag/v3.0.1
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