# reveal-run-in-terminal

_**IMPORTANT NOTE**_: This project is a non-aggressive fork of https://github.com/dluxemburg/reveal-run-in-terminal existing solely due to the fact that the original project seems dead : no PR has been merged since 2017, and no issue has received any kind of comment since 2016. As I need at least one release of this project, I chose to fork it and to let people know this fork exist. If @dluxemburg one day come back to this project, I will be glad to give him back any progress made.

Add executable code examples to you [reveal.js](https://github.com/hakimel/reveal.js/#revealjs) presentation.

Tabbing between Keynote and a terminal looks terrible and it is impossible to type with people watching anyway.

Looks like this:

![](https://github.com/dluxemburg/reveal-run-in-terminal/blob/master/demo.gif?raw=true&v=2)

_**IMPORTANT NOTE**_: This, um, exposes a URL that can be used to execute user-provided commands on your machine. There are a few measures taken to restrict this to its intended use, but it's almost certainly still exploitable somehow. Be careful!

## Usage

### Run the Server

We provide servers for "some" languages (the ones for which the plugin developers have some experience with).
If your server-side language of choice isn't listed here ... see "Implementing a server".

#### Run the JS server
The plugin requires that your presentation be served by [Express](https://expressjs.com/). A minimal version looks like this:

```javascript
const express = require('express');
const revealRunInTerminal = require('reveal-run-in-terminal');

let app = express();

app.use(revealRunInTerminal());
app.use(express.static('node_modules/reveal.js'));

app.listen(5000);
```

Options for `revealRunInTerminal`:

- **`publicPath`** (_default_: `'.'`): Directory to serve files and load executed code from.
- **`commandRegex`** (_default_: `/\S*/`): Regex that executable must match. This is a safety measure to make sure you don't run anything you didn't intend to.
- **`allowRemote`** (_default_: `false`): Allow command-execution requests from non-localhost sources. Probably don't ever do this.
- **`log`** (_default_: `false`): Whether to log executed commands (along with PID and exit code) to the server console.

The server handles exposing the plugin's client-side JS and CSS dependencies. It's up to you make sure reveal.js files are exposed (the above is a good approach). You can keep your own source files (including reveal.js ones if you're vendoring them) in the public path reveal-run-in-terminal uses, but you do not have to.

You can also see an example usage in [demo/app.js](demo/app.js)

### Include the CSS

```html
<link rel="stylesheet" href="plugin/reveal-run-in-terminal.css">
```

### Include the JS

You should use reveal.js's plugin system, like this:

```javascript
Reveal.initialize({
  // some options
  dependencies: [
    {
      src: 'plugin/reveal-run-in-terminal.js',
      callback: function() { RunInTerminal.init(); },
      async: true
    }
    // more plugins
  ]
});
```

Nothing will happen until `RunInTerminal#init` is called. You should also include the highlight plugin if you want code to be syntax highlighted.

`RunInTerminal#init` options:

- **`defaultBin`**: Default value for the `data-run-in-terminal-bin` attribute of individual slides (the executable used to run each code example).

### Add Some Slides

```html
<section
  data-run-in-terminal="code/some-great-example.js"
  data-run-in-terminal-bin="node"
>
  <h2>Here Is A Great Example</h2>
</section>
```

The `section` elements for reveal-run-in-terminal slides use these attributes:

- **`data-run-in-terminal`** (_required_): Path to the code to display and run.
- **`data-run-in-terminal-bin`** (_required unless `defaultBin` was passed to `TerminalSlides#init`_): The executable used to run the code example.
- **`data-run-in-terminal-args`**: Additional space-separated arguments to pass to the command to be run. Use single quotes for values including spaces.

The slide above will initially display code from `{publicPath}/code/some-great-example.js` and an empty simulated terminal prompt. Two [fragments](https://github.com/hakimel/reveal.js/#fragments) are added by the plugin:

- The first displays the command that will be run (`node code/some-great-example.js` in this case).
- The second adds the `stdout` and `stderr` from that command as executed by the server.

So, the process goes:

- Advance to slide (empty prompt)
- Advance to command fragment (prompt with command)
- Advance to command execution (output incrementally added after command)
- Advance to next silde

## Developing

### Demo Server

`npm start` runs it on port 5000.

### Implementing a server
A server for revealjs-run-in-terminal should implement a classical http file server **and** the following endpoint

    GET reveal-run-in-terminal?bin={binary}&src={src-path}&args={args}

Where

* `binary` is a name of a binary available on `$PATH`
* `src` is an executable script for `binary`
* `args` are a list of space-separated arguments

The `demo` folder contains a few examples that can be used to validate your implementation.
The requests used are

    GET /reveal-run-in-terminal?bin=node&src=code%2Fnode-example.js
    GET /reveal-run-in-terminal?bin=node&src=code%2Fnode-error-example.js
    GET /reveal-run-in-terminal?bin=ruby&src=code%2Fruby-argv-example.rb&args=the%20quick%20%27brown%20fox%27

### Client Code

`npm run build` browserifies it.

### How to release ?

Just run [`smooth-release](https://github.com/buildo/smooth-release)` which performs "clean" release in a way compatible with my maven habitus.

### Notes

- `/reveal-run-in-terminal` is implemented as a `GET` request in order to use the `EventSource` API on the client to stream process output. Yes, socket.io something something but this avoids additional dependencies and is pretty simple.
- It would be cool to do this for Node specifically using the `vm` module instead of spawning a process but I couldn't figure out how to capture `stderr`/`stdout`/process termination in a way that reliably mimicked what running a script would do.
- Maybe it would be better to use `#!` syntax at the top of files to specify how to run them instead of requiring that option per-slide? I didn't want to require the code files to be executable or have to manipulate them before putting them on the page.

### Goals

- Record command output so that live presentations can be given with static assets.
- Colorize `stdout` vs `stderr`.
- Display process exit code somehow.
- Better integration with other plugins (is it possible to use this and server notes? multiplexing?).
- Source highlighting.
- Source diffing.

