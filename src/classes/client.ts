import SuperMap from "@thunder04/supermap";
import { AttachmentBuilder, Client, ClientOptions, Collection, EmbedBuilder, Message, Snowflake } from "discord.js";
import { Button } from "./button";
import { Command } from "./command";

export class GiveawayClient extends Client{
    commands: Collection<string, Command>
    buttons: Collection<string, Button>
    giveawayCache: Collection<string, string[]>
    blacklisted: Snowflake[]
    confirmationcheck: SuperMap<Snowflake, Snowflake[]>
    constructor(options: ClientOptions){
        super(options)
        this.commands = new Collection()
        this.buttons = new Collection()
        this.giveawayCache = new Collection()
        this.confirmationcheck = new SuperMap({expireAfter: 1000*60*60})
        this.blacklisted = []
    }

    async log(message: string | EmbedBuilder | EmbedBuilder[], files?: AttachmentBuilder[]): Promise<Message | null> {
        let guild = await this.guilds.fetch(process.env["GUILD_ID"]!)
        return await guild.channels.fetch(process.env["LOG_CHANNEL_ID"]!).then(async c => {
            if(c?.isTextBased()) {
                return await c.send(typeof message === "string" ? {content: message, files: files?.length ? files : []} : Array.isArray(message) ? {embeds: message, files: files?.length ? files : []} : {embeds: [message], files: files?.length ? files : []})
            } 
            else return null
        })
    }
}