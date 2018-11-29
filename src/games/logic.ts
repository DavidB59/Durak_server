import { Game, Player } from './entities'

import { Card } from './cards'

// export const newGame = () => {
//   const game = Game.create()

//   for (let i = 0; i < 6; i++) {
//     game.players[0].hand = game.deckOfCards.slice(1)
//     game.players[1].hand = game.deckOfCards.slice(1)
//   }

//   game.trumpCard = game.deckOfCards.slice(1)[0]
//   game.deckOfCards.push(game.trumpCard)

//   return game.save
// }

export const attack = (game: Game, player: Player, cardCode) => {
  if (game.onTable.length > 0) throw new Error("table is not empty")

  const playerCardIndex = player.hand.findIndex(handCard => {
    // console.log('====', handCard.code, cardCode)
    // return handCard.code == cardCode
     return handCard.code == cardCode.cardCode
  })
  player.hand.forEach(handCard => console.log (handCard.code))

  const playerCard : Card = player.hand.splice(playerCardIndex, 1)[0]
  console.log('=========playerCardIndex=======' , playerCardIndex)
  console.log('=========CardCode=======', cardCode)

  console.log('<===========>',player.hand)
  game.onTable.push(playerCard) 
  console.log('===========>', game.onTable) 

  // player.save()
  // game.save()
}

// canDefend returns an arary of cards which possibly can be used for defense.
export const canDefend = (game: Game, player: Player) => {
  if (!game.onTable) throw new Error("table is empty")

  return player.hand.filter(card => {
    if ((game.onTable[0].suit != card.suit) && (card.suit != game.trumpCard.suit)) {
      // suits do not match AND player card is not trump
      return false
    } else if ((game.onTable[0].value && card.value) && game.onTable[0].value >= card.value) {
      // card on table is of a bigger value than player's card
      return false
    }
    return true
  })
}

export const defend = (game: Game, player: Player, cardCode) => {
  const cardsToDefend = canDefend(game, player)
  if (cardsToDefend.length === 0) throw new Error("you cann't defend")

  const playerCardIndex = player.hand.findIndex(handCard => handCard.code == cardCode.cardCode)
  console.log('jhfjhfghfhgf')
  player.hand.splice(playerCardIndex, 1)[0]
  console.log('============')
  game.onTable = []
  // player.save()
  // game.save()

}

export const takeCardFromTable = (game: Game, player: Player) => {
  player.hand.push(game.onTable[0])
}

export const takeCards = (game: Game) => {
  while (true) {
    if (game.deckOfCards.length == 0) break
    if (game.players[0].hand.length <= 6) game.players[0].hand.push(<Card>game.deckOfCards.pop())

    if (game.deckOfCards.length == 0) break
    if (game.players[1].hand.length <= 6) game.players[1].hand.push(<Card>game.deckOfCards.pop())

    if (game.players[0].hand.length === 6 && game.players[1].hand.length === 6) break
  }
  // return game.save()
}

export const isFinished = (game: Game) => {
  if (game.deckOfCards.length !== 0) return undefined

  if (game.players[0].hand.length === 0) return game.players[0]
  else if (game.players[1].hand.length === 0) return game.players[1]

  return undefined
}