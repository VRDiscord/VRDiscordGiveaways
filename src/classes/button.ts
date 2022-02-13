import { ButtonContext } from "./buttonContext";
import { GiveawayClient } from "./client";

export class Button{
    name: string
    regex: RegExp
    staffOnly: boolean
    client?: GiveawayClient
    constructor(){
        this.name = ""
        this.regex = /./
        this.staffOnly = false
        this.client = undefined
    }

    async run(_ctx: ButtonContext): Promise<any> {

    }
}