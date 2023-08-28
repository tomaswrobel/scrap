# <div style="background: #4c97ff;padding: 10px;display: flex; align-items: center; color: white;"><img src="src/images/scrap.png" alt="Scrap" style="height: 1em;"></div>

Welcome to the official repository of **Scrap** - the tool designed to simplify the transition from Scratch to JavaScript. If you're a beginner programmer who's familiar with Scratch and looking to delve into JavaScript, Scrap is here to help bridge the gap and make your learning journey smoother.

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Usage](#usage)
- [Features](#features)
- [Contributing](#contributing)
- [License](#license)

## Introduction

Scratch is an excellent platform for beginners to get started with programming, thanks to its visual drag-and-drop interface. However, transitioning from Scratch to text-based languages like JavaScript can be intimidating. Scrap aims to ease this transition by providing a set of tools, resources, and utilities that help Scratch users grasp the concepts of JavaScript more easily.

## Features

- **No VM or Interpreter** - Scrap is a pure JavaScript application that runs in your web browser. Unlike Scratch, it doesn't require any VM or interpreter to run your code. The engine is powered by [BlockLike.js](https://blocklike.org), a JavaScript library that allows you to write Scratch-like code in JavaScript.

- **Block-Based Interface** - Scrap's interface is block-based, just like Scratch. This makes it easier for Scratch users to get started with Scrap. The block-based interface is powered by [Blockly](https://developers.google.com/blockly).

- **Text-Based Code Editor** - Scrap features a text-based code editor that allows you to write JavaScript code. The code editor is powered by [CodeMirror](https://codemirror.net/).

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

## Contributing

I welcome contributions from the community to make Scrap even better. If you're interested in contributing, please refer to my [Contribution Guidelines](CONTRIBUTING.md) for detailed information on how to get involved.

## License

Scrap is released under the [MIT License](LICENSE), which means you're free to use, modify, and distribute the project as long as you retain the original license terms.

---

Ready to make your transition from Scratch to JavaScript smoother? Scrap is here to assist you. Start exploring, experimenting, and learning with Scrap today! If you have any questions or need help, feel free to reach out to us in the Issues section.

<style>
    img {
        height: 1em;
    }

    h1 {
        
    }
</style>