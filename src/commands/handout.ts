import { ApplicationCommandData, ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import request from "centra"

const commandData: ApplicationCommandData = {
    type: ApplicationCommandType.ChatInput,
    name: "handout",
    description: "Creates a message where members can just get a key",
    options: [{
        type: ApplicationCommandOptionType.String,
        name: "description",
        description: "The description of what the prize is",
        required: true
    },{
        type: ApplicationCommandOptionType.Attachment,
        name: "prize_attachment",
        description: "The file with the keys",
        required: true
    }]
}


export default class Test extends Command {
    constructor() {
        super(commandData)
        this.name = commandData.name
        this.staffOnly = true
        this.description = `Starts a handout process`
    }
    async run(ctx: CommandContext): Promise<any> {
        const attachment = ctx.interaction.options.getAttachment("prize_attachment", true)
        const description = ctx.interaction.options.getString("description", true)
        let prizes = await request(attachment.url, "GET").send().then(res => {
            if(res.statusCode !== 200) return []
            return res.body.toString().split("\n").map(k => k.replace("\r", "")).filter(v => v)
        }).catch(() => [])
        if(!prizes.length) return ctx.error("Invalid file")

        let embed = new EmbedBuilder()
        .setColor(Colors.Aqua)
        .setTitle("New Handout")
        .setDescription(`${description}\n\nClick the button below to receive a key.`)

        let components = [{
            type: 1,
            components: [{
                type: 2,
                custom_id: "getkey",
                label: "Click to get a key",
                style: 1
            }]
        }]

        let res = await ctx.interaction.channel?.send({embeds: [embed], components}).catch(() => null)
        if(!res) return ctx.error("Unable to create message")
        let query = `INSERT INTO freekeys (id, channel_id, prize) VALUES ${prizes.map((_, i) => `($1, $2, $${i+3})`).join(", ")}`
        ctx.sql.query(query, [res!.id, ctx.interaction.channelId, ...prizes])

        ctx.reply({content: "Created handout message", ephemeral: true})
    }
}