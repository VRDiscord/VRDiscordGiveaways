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
        type: ApplicationCommandOptionType.String,
        name: "prize_attachment_url",
        description: "The link of the file with the keys",
        required: true
    }]
}


export default class Test extends Command {
    constructor() {
        super(commandData)
        this.name = commandData.name
        this.staffOnly = true
        this.description = `Deletes a giveaway`
    }
    async run(ctx: CommandContext): Promise<any> {
        let prizes = await request(ctx.arguments.get("prize_attachment_url")?.value?.toString()!, "GET").send().then(res => {
            if(res.statusCode !== 200) return []
            return res.body.toString().split("\n").map(k => k.replace("\r", "")).filter(v => v)
        }).catch(() => [])
        if(!prizes.length) return ctx.error("Invalid file")

        let embed = new EmbedBuilder()
        .setColor(Colors.Aqua)
        .setTitle("New Handout")
        .setDescription(`${ctx.arguments.get("description")?.value ?? "Freebies"}\n\nClick the button below to receive a key.`)

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
        let query = `INSERT INTO freekeys VALUES ${prizes.map(p => `(DEFAULT, '${res!.id}', '${p}', NULL, '${ctx.interaction.channelId}')`).join(", ")}`
        ctx.sql.query(query)

        ctx.reply({content: "Created handout message", ephemeral: true})
    }
}