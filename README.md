# Scrap 
![Scrap Engine Version][engine-badge]
![Built on blocky][blockly-badge]

Welcome to the official repository of **Scrap** - the tool designed to simplify the transition from Scratch to JavaScript. If you're a beginner programmer who's familiar with Scratch and looking to delve into JavaScript, Scrap is here to help bridge the gap and make your learning journey smoother.

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Usage](#usage)
- [Features](#features)
- [Roadmap](#roadmap)
- [Scrap Logo Explanation](#scrap-logo-explanation)
- [License](#license)

## Introduction

Scratch is an excellent platform for beginners to get started with programming, thanks to its visual drag-and-drop interface. However, transitioning from Scratch to text-based languages like JavaScript can be intimidating. Scrap aims to ease this transition by providing a set of tools, resources, and utilities that help Scratch users grasp the concepts of JavaScript more easily.

## Features

- **No VM or Interpreter** - Scrap is a pure JavaScript application that runs in your web browser. Unlike Scratch, it doesn't require any VM or interpreter to run your code. The engine is powered by [BlockLike.js](https://blocklike.org), a JavaScript library that allows you to write Scratch-like code in JavaScript.

- **Block-Based Interface** - Scrap's interface is block-based, just like Scratch. This makes it easier for Scratch users to get started with Scrap. The block-based interface is powered by [Blockly](https://developers.google.com/blockly).

- **Text-Based Code Editor** - Scrap features a text-based code editor that allows you to write JavaScript code. The code editor is powered by [Prism Code Editor](https://prism-code-editor.netlify.app).

## Getting Started

### Installation

To get started with Scrap, you need to have Node.js installed on your machine. If you don't have it yet, you can download and install it from the official [Node.js website](https://nodejs.org/).

Once you have Node.js installed, follow these steps:

1. Clone this repository: `git clone https://github.com/tomas-wrobel/scrap.git`
2. Navigate to the project folder: `cd scrap`
3. Install project dependencies: `npm install`

### Usage

After installing the required dependencies, you can launch the Scrap interactive environment:

```bash
npm run dev
```

This will open up a local development server where you can access the Scrap interface using your web browser.

## Roadmap

Scrap is still in its early stages of development. Here's what's planned for the future:

- **More Blocks** - Scrap currently supports only a limited number of blocks. More blocks will be added in the future to make Scrap more useful.

- **Scratch Compatibility** - Scrap is not fully compatible with Scratch yet. In the future, Scrap will be made compatible with Scratch to make the transition smoother.

- **More Features** - Scrap will be getting more features in the future, such as a built-in code editor, a better paint editor, and more.

- **More Resources** - Scrap will be getting more resources in the future, such as tutorials, guides, and more.

## Scrap Logo Explanation

The logo for Scrap shares a visual resemblance with the Scratch logo as a deliberate homage. Here's what you need to know:

- **Font Choice**: Scrap uses the "Black Boys on Mopeds" font, the same as Scratch's logo, which is freeware and freely usable.

- **No Copyright Infringement**: Scrap respects copyright laws and does not infringe on Scratch's intellectual property. The similarity is a tribute, not a copy.

- **Non-Commercial**: Scrap is a non-commercial project, and its logo is used to recognize Scratch's influence on its mission to help beginners transition from Scratch to JavaScript.

In essence, Scrap's logo is a respectful tribute to Scratch, complying with legal and ethical standards.

## License

Scrap is released under the [MIT License](LICENSE), which means you're free to use, modify, and distribute the project as long as you retain the original license terms.

---

Ready to make your transition from Scratch to JavaScript smoother? Scrap is here to assist you. Start exploring, experimenting, and learning with Scrap today! If you have any questions or need help, feel free to reach out to us in the Issues section.

[blockly-badge]: https://img.shields.io/badge/built_on-blockly-blue?logo=data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgaWQ9IkxheWVyXzYiCiAgIGRhdGEtbmFtZT0iTGF5ZXIgNiIKICAgdmlld0JveD0iMCAwIDE5MiAxOTIiCiAgIHZlcnNpb249IjEuMSIKICAgc29kaXBvZGk6ZG9jbmFtZT0ibG9nby1vbmx5LnN2ZyIKICAgaW5rc2NhcGU6dmVyc2lvbj0iMC45Mi4ycHJlMCAoOTczZTIxNiwgMjAxNy0wNy0yNSkiCiAgIGlua3NjYXBlOmV4cG9ydC1maWxlbmFtZT0iL3Vzci9sb2NhbC9nb29nbGUvaG9tZS9lcGFzdGVybi9Eb2N1bWVudHMvQmxvY2tseSBMb2dvcy9TcXVhcmUvbG9nby1vbmx5LnBuZyIKICAgaW5rc2NhcGU6ZXhwb3J0LXhkcGk9Ijk2IgogICBpbmtzY2FwZTpleHBvcnQteWRwaT0iOTYiPgogIDxtZXRhZGF0YQogICAgIGlkPSJtZXRhZGF0YTkxMyI+CiAgICA8cmRmOlJERj4KICAgICAgPGNjOldvcmsKICAgICAgICAgcmRmOmFib3V0PSIiPgogICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PgogICAgICAgIDxkYzp0eXBlCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4KICAgICAgICA8ZGM6dGl0bGU+bG9nby1vbmx5PC9kYzp0aXRsZT4KICAgICAgPC9jYzpXb3JrPgogICAgPC9yZGY6UkRGPgogIDwvbWV0YWRhdGE+CiAgPHNvZGlwb2RpOm5hbWVkdmlldwogICAgIHBhZ2Vjb2xvcj0iI2ZmZmZmZiIKICAgICBib3JkZXJjb2xvcj0iIzY2NjY2NiIKICAgICBib3JkZXJvcGFjaXR5PSIxIgogICAgIG9iamVjdHRvbGVyYW5jZT0iMTAiCiAgICAgZ3JpZHRvbGVyYW5jZT0iMTAiCiAgICAgZ3VpZGV0b2xlcmFuY2U9IjEwIgogICAgIGlua3NjYXBlOnBhZ2VvcGFjaXR5PSIwIgogICAgIGlua3NjYXBlOnBhZ2VzaGFkb3c9IjIiCiAgICAgaW5rc2NhcGU6d2luZG93LXdpZHRoPSIyNTYwIgogICAgIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9IjEzNzkiCiAgICAgaWQ9Im5hbWVkdmlldzkxMSIKICAgICBzaG93Z3JpZD0iZmFsc2UiCiAgICAgaW5rc2NhcGU6em9vbT0iMiIKICAgICBpbmtzY2FwZTpjeD0iMjM5Ljg3NjQyIgogICAgIGlua3NjYXBlOmN5PSI1OS43NDI2ODciCiAgICAgaW5rc2NhcGU6d2luZG93LXg9IjAiCiAgICAgaW5rc2NhcGU6d2luZG93LXk9IjAiCiAgICAgaW5rc2NhcGU6d2luZG93LW1heGltaXplZD0iMSIKICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJnMTAxMyIgLz4KICA8ZGVmcwogICAgIGlkPSJkZWZzOTAyIj4KICAgIDxzdHlsZQogICAgICAgaWQ9InN0eWxlOTAwIj4uY2xzLTF7ZmlsbDojNDI4NWY0O30uY2xzLTJ7ZmlsbDojYzhkMWRiO308L3N0eWxlPgogIDwvZGVmcz4KICA8dGl0bGUKICAgICBpZD0idGl0bGU5MDQiPmxvZ28tb25seTwvdGl0bGU+CiAgPGcKICAgICBpZD0iZzEwMTMiCiAgICAgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjMuNTAwMDAyLC03LjkxMjExMDUpIgogICAgIGlua3NjYXBlOmV4cG9ydC14ZHBpPSI5NiIKICAgICBpbmtzY2FwZTpleHBvcnQteWRwaT0iOTYiPgogICAgPHBhdGgKICAgICAgIGlkPSJwYXRoOTA2IgogICAgICAgZD0iTSAyMC4xNDA2MjUsMzIgQyAxMy40MzM1OTgsMzEuOTk0NDY4IDcuOTk0NDY4NCwzNy40MzM1OTggOCw0NC4xNDA2MjUgViAxNDguODU5MzggQyA3Ljk5NDQ3LDE1NS41NjY0MSAxMy40MzM1OTgsMTYxLjAwNTUzIDIwLjE0MDYyNSwxNjEgaCA0LjcyNjU2MyBjIDIuMzMwODI2LDguNzQxODIgMTAuMjQ1NzUxLDE0LjgyNTg1IDE5LjI5Mjk2OCwxNC44MzAwOCBDIDUzLjIwMTU2MiwxNzUuODE4NzggNjEuMTA4MTc2LDE2OS43MzYyMSA2My40Mzc1LDE2MSBoIDQuODQxNzk3IDE1LjcyNjU2MiBjIDQuNDE4Mjc4LDAgOCwtMy41ODE3MiA4LC04IFYgNDAgbCAtOCwtOCB6IgogICAgICAgc3R5bGU9ImZpbGw6IzQyODVmNCIKICAgICAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgICAgICBzb2RpcG9kaTpub2RldHlwZXM9ImNjY2NjY2Njc3NjY2MiIC8+CiAgICA8cGF0aAogICAgICAgc29kaXBvZGk6bm9kZXR5cGVzPSJjY2NjY2NjY2NjY2NjY2NjYyIKICAgICAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiCiAgICAgICBpZD0icGF0aDkwOCIKICAgICAgIGQ9Ik0gODAuMDA3ODEyLDMxLjk5NDE0MSBDIDc5Ljk5NzE0Nyw0OS42OTY4ODcgODAsNjcuMzk2NTI1IDgwLDg1LjEwOTM3NSBMIDYzLjM2OTE0MSw3NS43MTA5MzggQyA2MC45NzE3ODQsNzQuMzU4MTg5IDU4LjAwNDg5MSw3Ni4wODcxNjggNTgsNzguODM5ODQ0IHYgNDAuNjIxMDk2IGMgMC4wMDQ5LDIuNzUyNjcgMi45NzE3ODYsNC40ODE2NSA1LjM2OTE0MSwzLjEyODkgTCA4MCwxMTMuMTg5NDUgdiAzNy41OTE4IDIuMjE4NzUgOCBoIDggMS40MjU3ODEgMzYuMDU0Njg5IGMgNi4zNjE5NSwtMi42ZS00IDExLjUxOTI3LC01LjE1NzU4IDExLjUxOTUzLC0xMS41MTk1MyBWIDQzLjQ4MDQ2OSBDIDEzNi45NzgyMiwzNy4xMzM3NzUgMTMxLjgyNzIsMzIuMDAwMjIyIDEyNS40ODA0NywzMiBaIgogICAgICAgc3R5bGU9ImZpbGw6I2M4ZDFkYiIgLz4KICA8L2c+Cjwvc3ZnPgo=
[engine-badge]: https://img.shields.io/badge/scrap--engine-1.4.2-red?logo=npm