Yoyak: An LLM-powered CLI tool for summarizing web pages
========================================================

[![Demo session][Demo session thumbnail]][Demo session]

This is a small CLI tool that uses LLM to summarize and translate web pages.

[Demo session thumbnail]:  https://asciinema.org/a/706701.svg
[Demo session]: https://asciinema.org/a/706701


Installation
------------

We distribute the official executables for Linux, macOS, and Windows.  You can
download them from the [releases page].

Or if you have [Deno] installed on your system, you can install this program by
running the following command:

~~~~ bash
deno install -gENRSW jsr:@hongminhee/yoyak/cli
~~~~

[releases page]: https://github.com/dahlia/yoyak/releases
[Deno]: https://deno.com/


Usage
-----

At very first, you need to set the model you want to use. You can do this by
running the following command (see also [supported models](#supported-models)
below):

~~~~ bash
yoyak set-model gemini-2.5-flash
~~~~

It asks for the API key via the standard input, and stores it in configuration
file.

Then you can use the `yoyak summary` command to summarize a web page:

~~~~ bash
yoyak summary https://github.com/dahlia/yoyak
~~~~

It prints the summary of the web page to the standard output.

If you want to translate the summary to another language, you can use
the `-l`/`--language` option (which takes [ISO 639-1] language code):

~~~~ bash
yoyak summary -l ko https://github.com/dahlia/yoyak
~~~~

It translates the summary to Korean.

> [!TIP]
> You can also give a local file path or `-` as an argument.  If `-` is given,
> the command reads the input from the standard input.

[ISO 639-1]: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes


Shell completion
----------------

Yoyak provides shell completion scripts for bash, fish, and zsh.

### Bash

To enable bash completion, add the following line to your *~/.bashrc* or
*~/.bash_profile*:

~~~~ bash
source <(yoyak completions bash)
~~~~

### Fish

To enable fish completion, add the following line to your
*~/.config/fish/config.fish*:

~~~~ fish
source (yoyak completions fish | psub)
~~~~

### Zsh

To enable zsh completion, add the following line to your *~/.zshrc*:

~~~~ zsh
source <(yoyak completions zsh)
~~~~

Or run the following command to use zsh fpath completions:[^1]

~~~~ zsh
yoyak completions zsh > /usr/local/share/zsh/site-functions/_yoyak
~~~~

[^1]: The *site-functions* path may vary depending on your system.


Supported models
----------------

 -  `claude-3-5-haiku-latest`
 -  `claude-3-5-sonnet-latest`
 -  `claude-3-7-sonnet-latest`
 -  `claude-opus-4-0`
 -  `claude-opus-4-1-20250805`
 -  `claude-sonnet-4-0`
 -  `deepseek-chat`
 -  `deepseek-reasoner`
 -  `gemini-2.5-flash`
 -  `gemini-2.5-flash-lite`
 -  `gemini-2.5-pro`
 -  `gemini-3-flash-preview`
 -  `gemini-3-pro-preview`
 -  `gemini-3.1-flash-lite-preview`
 -  `gemma3`
 -  `gpt-4.1`
 -  `gpt-4.1-mini`
 -  `gpt-4.1-nano`
 -  `gpt-4o`
 -  `gpt-4o-mini`
 -  `gpt-5`
 -  `gpt-5-mini`
 -  `gpt-5-nano`
 -  `gpt-5.1`
 -  `gpt-5.3-chat-latest`
 -  `gpt-5.4`
 -  `o3`
 -  `o4-mini`

Older configured model names are still accepted and are mapped to the current
canonical names when settings are loaded or updated.


Etymology
---------

Yoyak ([要約]) is a Sino-Korean word that means *summary*.

[要約]: https://en.wiktionary.org/wiki/%EC%9A%94%EC%95%BD#Etymology_1

<!-- cSpell: ignore gENRSW psub fpath Sino-Korean -->
