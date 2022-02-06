import { Client, ClientOptions, Collection, Message, MessageAttachment, MessageEmbed } from "discord.js";
import { Button } from "./button";
import { Command } from "./command";

export class GiveawayClient extends Client{
    commands: Collection<string, Command>
    buttons: Collection<string, Button>
    giveawayCache: Collection<string, string[]>
    constructor(options: ClientOptions){
        super(options)
        this.commands = new Collection()
        this.buttons = new Collection()
        this.giveawayCache = new Collection()
    }

    async log(message: string | MessageEmbed | MessageEmbed[], files?: MessageAttachment[]): Promise<Message | null> {
        let guild = await this.guilds.fetch(process.env["GUILD_ID"]!)
        return await guild.channels.fetch(process.env["LOG_CHANNEL_ID"]!).then(async c => {
            if(c?.isText()) {
                return await c.send(typeof message === "string" ? {content: message, files: files?.length ? files : []} : Array.isArray(message) ? {embeds: message, files: files?.length ? files : []} : {embeds: [message], files: files?.length ? files : []})
            } 
            else return null
        })
    }
}