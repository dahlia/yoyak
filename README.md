Yoyak: An LLM-powered CLI tool for summarizing web pages
========================================================

> [!NOTE]
> This project is still in development and is not yet ready for use.

This is a small CLI tool that uses LLM to summarize and translate web pages.


Installation
------------

You need [Deno] installed on your system to run this app first.  Then you can
install this program by running the following command:

~~~~ bash
deno install --global --allow-net --allow-env jsr:@hongminhee/yoyak/cli
~~~~

[Deno]: https://deno.com/


Usage
-----

At very first, you need to set the model you want to use. You can do this by
running the following command (see also [supported models](#supported-models)
below):

~~~~ bash
yoyak set-model gemini-2.0-flash-exp
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

[ISO 639-1]: https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes


Supported models
----------------

 -  `chatgpt-4o-latest`
 -  `claude-3-5-haiku-latest`
 -  `claude-3-5-sonnet-latest`
 -  `claude-3-opus-latest`
 -  `deepseek-chat`
 -  `deepseek-reasoner`
 -  `gemini-1.5-flash`
 -  `gemini-1.5-flash-8b`
 -  `gemini-1.5-pro`
 -  `gemini-2.0-flash-exp`
 -  `gpt-4o`
 -  `gpt-4o-mini`
 -  `o1`
 -  `o1-mini`
 -  `o1-preview`
 -  `o3-mini`
