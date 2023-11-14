import { Account, ERC1155Balance } from "../generated/schema"
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts/index"
import { Coefficient } from "./enum"

// export function calculatePriceAndFee(deal: Deal): void {
//     deal.price = calculatePrice(deal.buyAmount, deal.sellAmount)
//     deal.fee = calculateFee(deal.buyAmount)
// }

function calculatePrice(buyAmount: BigInt, sellAmount: BigInt): BigInt {
    if (buyAmount == BigInt.fromI32(0) || sellAmount == BigInt.fromI32(0)){
        return BigInt.fromI32(0)
    }
    return buyAmount.div(sellAmount)
}

function calculateFee(buyAmount: BigInt): BigDecimal {
    if (buyAmount == BigInt.fromI32(0)){
        BigDecimal.fromString("0")
    }
    return buyAmount.toBigDecimal().times(BigDecimal.fromString(Coefficient.FEE))
}
export function ensureAccount(address: Address): Account {
    let accountId = address.toHex();
    let account = Account.load(accountId);
    if (account === null) {
      account = new Account(accountId);
      account.save();
    }
    return account as Account;
  }
export function fetchOrCreateAccount(address: Address): Account {
    let accountId = address.toHex();
    let account = Account.load(accountId);
    if (account == null) {
        account = new Account(accountId);
        account.save();
    }
    return account as Account;
}
  
export function updateERC1155Balance(accountAddress: Address, tokenId: string, value: BigInt, contractAddress: string): ERC1155Balance {
    let balanceId = accountAddress.toHex() + "-" + tokenId;
    let balance = ERC1155Balance.load(balanceId);
    if (balance == null) {
        balance = new ERC1155Balance(balanceId);
        balance.value = value.toBigDecimal();
        balance.valueExact = value;
        balance.token = tokenId;
        balance.contract = contractAddress;
    } else {
        balance.value = balance.value.plus(value.toBigDecimal());
        balance.valueExact = balance.valueExact.plus(value);
    }
    balance.save();
    return balance
}