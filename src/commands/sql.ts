import { ApplicationCommandData, Message, MessageAttachment, MessageEmbed, NewsChannel, TextChannel } from "discord.js";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import { determineWinner } from "../intervals/determineWinners";
import { syncDB } from "../intervals/syncdb";
import util from "util"

const commandData: ApplicationCommandData = {
    type: ApplicationCommandTypes.CHAT_INPUT,
    name: "sql",
    description: "Query the database",
    options: [{
        type: "STRING",
        name: "query",
        description: "The query you want to query",
        required: true
    }]
}


export default class Test extends Command {
    constructor() {
        super(commandData)
        this.name = commandData.name
        this.staffOnly = true
        this.description = `Queries the database`
    }
    async run(ctx: CommandContext): Promise<any> {
        let query = ctx.arguments.get("query")?.value?.toString()!
        let res = await ctx.sql.query(query).catch(e => e)
        let text = util.inspect(res, {depth: 5})
        if(text.length > 1900) {
            let file = new MessageAttachment(Buffer.from(text), "result.txt")
            ctx.reply({files: [file], content: "Result attached below"})
        } else {
            ctx.reply({content: `\`\`\`json\n${text}\n\`\`\``})
        }
    }
}