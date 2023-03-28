import { ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType, AttachmentBuilder, EmbedBuilder } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import util from "util"

const commandData: ApplicationCommandData = {
    type: ApplicationCommandType.ChatInput,
    name: "sql",
    description: "Query the database",
    options: [{
        type: ApplicationCommandOptionType.String,
        name: "query",
        description: "The query you want to query",
        required: true
    }]
}

let owner = ["134295609287901184"]

export default class Test extends Command {
    constructor() {
        super(commandData)
        this.name = commandData.name
        this.staffOnly = true
        this.description = `Queries the database`
    }
    async run(ctx: CommandContext): Promise<any> {
        if(!owner.includes(ctx.interaction.user.id)) return ctx.error("You can't use this command")
        let query = ctx.interaction.options.getString("query", true)
        let res = await ctx.sql.query(query).catch(e => e)
        let text = util.inspect(res, {depth: 5})
        if(text.length > 1900) {
            let file = new AttachmentBuilder(Buffer.from(text), {name: "result.txt"})
            ctx.reply({files: [file], content: "Result attached below"})
        } else {
            ctx.reply({content: `\`\`\`json\n${text}\n\`\`\``})
        }
    }
}