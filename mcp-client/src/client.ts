import Anthropic from "@anthropic-ai/sdk";
import { Tool, MessageParam } from "@anthropic-ai/sdk/resources";
import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import readline from "readline/promises";
import dotenv from "dotenv";
import { loadEnv } from "./util.js";
import { Prompt } from "@modelcontextprotocol/sdk/types.js";

dotenv.config();

const processLocal = loadEnv(".env");

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? processLocal.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

export class MCPClient {
  private mcp: Client;
  private anthropic: Anthropic;
  private transport: StdioClientTransport | null = null;
  private prompts: Prompt[] = [];

  constructor() {
    this.anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    this.mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });
    console.log("MCP Client loaded");
  }

  // connect client to MCP server
  async connectToServer(serverScriptPath: string) {
    try {
      const isJs = serverScriptPath.endsWith(".js");
      const isPy = serverScriptPath.endsWith(".py");
      if (!isJs && !isPy) {
        throw new Error("Server script must be a .js or .py file");
      }
      const command = isPy ? (process.platform === "win32" ? "python" : "python3") : process.execPath;

      this.transport = new StdioClientTransport({ command, args: [serverScriptPath] });
      await this.mcp.connect(this.transport);

      const promptsResult = await this.mcp.listPrompts();
      console.log("heres the prompts");
      console.log(promptsResult);
      this.prompts = promptsResult.prompts;
      // prettier-ignore
      console.log("Connected to server with prompts:", this.prompts);
    } catch (e) {
      console.log("Failed to connect to MCP server: ", e);
      throw e;
    }
  }

  // call the tools and parse a response
  async processQuery(query: string) {
    console.log("hi");
    console.log(query);
    // const messages: MessageParam[] = [
    //   {
    //     role: "user",
    //     content: query,
    //   },
    // ];

    // const response = await this.anthropic.messages.create({
    //   model: "claude-sonnet-4-20250514",
    //   max_tokens: 1000,
    //   messages
    // });

    // const finalText = [];

    // for (const content of response.content) {
    //   if (content.type === "text") {
    //     finalText.push(content.text);
    //   } else if (content.type === "tool_use") {
    //     const toolName = content.name;
    //     const toolArgs = content.input as { [x: string]: unknown } | undefined;

    //     const result = await this.mcp.callTool({
    //       name: toolName,
    //       arguments: toolArgs,
    //     });
    //     finalText.push(`[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`);

    //     messages.push({
    //       role: "user",
    //       content: result.content as string,
    //     });

    //     const response = await this.anthropic.messages.create({
    //       model: "claude-sonnet-4-20250514",
    //       max_tokens: 1000,
    //       messages,
    //     });

    //     finalText.push(response.content[0].type === "text" ? response.content[0].text : "");
    //   }
    // }

    // return finalText.join("\n");
  }

  // main loop
  async chatLoop() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      console.log("\nMCP Client Started!");
      console.log("Type your queries or 'quit' to exit.");

      while (true) {
        const message = await rl.question("\nQuery: ");
        if (message.toLowerCase() === "quit") {
          break;
        }
        const response = await this.processQuery(message);
        console.log("\n" + response);
      }
    } finally {
      rl.close();
    }
  }

  async cleanup() {
    await this.mcp.close();
  }
}
