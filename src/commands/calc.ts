import type { CommandHandler, DiscordCommand } from "./types";

export const definition: DiscordCommand = {
  name: "calc",
  description: "計算式を計算します",
  options: [{ type: 3, name: "expression", description: "四則演算の計算式（例: (12 + 3) * 4）", required: true }],
};

class ExpressionParser {
  private position = 0;

  constructor(private readonly input: string) {}

  parse(): number {
    const value = this.parseAdditive();
    this.skipWhitespace();
    if (this.position !== this.input.length) throw new Error("unexpected token");
    if (!Number.isFinite(value)) throw new Error("non-finite result");
    return value;
  }

  private parseAdditive(): number {
    let value = this.parseMultiplicative();
    while (true) {
      this.skipWhitespace();
      const operator = this.input[this.position];
      if (operator !== "+" && operator !== "-") return value;
      this.position += 1;
      const right = this.parseMultiplicative();
      value = operator === "+" ? value + right : value - right;
    }
  }

  private parseMultiplicative(): number {
    let value = this.parseUnary();
    while (true) {
      this.skipWhitespace();
      const operator = this.input[this.position];
      if (operator !== "*" && operator !== "/") return value;
      this.position += 1;
      const right = this.parseUnary();
      if (operator === "/" && right === 0) throw new Error("division by zero");
      value = operator === "*" ? value * right : value / right;
    }
  }

  private parseUnary(): number {
    this.skipWhitespace();
    const operator = this.input[this.position];
    if (operator === "+" || operator === "-") {
      this.position += 1;
      const value = this.parseUnary();
      return operator === "-" ? -value : value;
    }
    return this.parsePrimary();
  }

  private parsePrimary(): number {
    this.skipWhitespace();
    if (this.input[this.position] === "(") {
      this.position += 1;
      const value = this.parseAdditive();
      this.skipWhitespace();
      if (this.input[this.position] !== ")") throw new Error("missing closing parenthesis");
      this.position += 1;
      return value;
    }
    const match = /^(?:\d+(?:\.\d*)?|\.\d+)/.exec(this.input.slice(this.position));
    if (!match) throw new Error("expected number");
    this.position += match[0].length;
    return Number(match[0]);
  }

  private skipWhitespace(): void {
    while (/\s/.test(this.input[this.position] ?? "")) this.position += 1;
  }
}

export const handle: CommandHandler = (interaction) => {
  const expression = String(interaction.data?.options?.find((option) => option.name === "expression")?.value ?? "").trim();
  if (!expression || expression.length > 100) {
    return new Response(JSON.stringify({ type: 4, data: { content: "計算式は1〜100文字で指定してください。", flags: 64 } }), {
      headers: { "content-type": "application/json" },
    });
  }
  try {
    const result = new ExpressionParser(expression).parse();
    return new Response(JSON.stringify({ type: 4, data: { content: `🧮 ${expression} = **${result}**` } }), {
      headers: { "content-type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ type: 4, data: { content: "計算式を解釈できません。四則演算（+、-、*、/）と括弧を使用してください。", flags: 64 } }), {
      headers: { "content-type": "application/json" },
    });
  }
};
