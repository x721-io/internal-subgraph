import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import {
    RoyaltiesSetForContract
  } from "../../generated/RoyaltiesRegistry/RoyaltiesRegistry";

  import { RoyaltiesRegistry} from "../../generated/schema"

  export function handleRoyaltiesRegistry(event: RoyaltiesSetForContract): void {
    const listroyalties = event.params.royalties;
    for(let i =0 ; i < listroyalties.length ; i++){
      let registry = RoyaltiesRegistry.load(event.address.toHexString()+ '-' + listroyalties[i].account.toHexString());
      if (!registry) {
        registry = new RoyaltiesRegistry(event.address.toHexString()+ '-' + listroyalties[i].account.toHexString());
        registry.tokenId = event.params.token.toHexString();
        registry.account = listroyalties[i].account.toHexString();
        registry.value = listroyalties[i].value.toI32();
        registry.collectionId = event.params.token.toHexString();
      }
      registry.save();
    }
  }