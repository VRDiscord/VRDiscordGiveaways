import { ApplicationCommandData, MessageAttachment } from "discord.js";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandTypes.CHAT_INPUT,
    name: "viewkeys",
    description: "Shows pending keys for a giveaway",
    options: [{
        type: "STRING",
        name: "message_id",
        description: "The id of the giveaway message",
        required: true
    }]
}


export default class Test extends Command {
    constructor() {
        super(commandData)
        this.name = commandData.name
        this.staffOnly = true
        this.description = `Shows keys for a giveaway`
    }
    async run(ctx: CommandContext): Promise<any> {
        let id = ctx.arguments.get("message_id")?.value?.toString() ?? ""
        let keys = await ctx.sql.query(`SELECT * FROM prizes WHERE id=$1`, [id])
        if(!keys.rowCount) return ctx.error("No keys for that giveaway found")
        let file = new MessageAttachment(Buffer.from(keys.rows.map(r => `Prize: ${r.prize} || Pending User: ${r.user_id ?? "none"}`).join("\n")), `${id}_keys.txt`)
        ctx.reply({content: `You have ${keys.rowCount} pending keys below from giveaway ${id}`, files: [file], ephemeral: true})
    }
}