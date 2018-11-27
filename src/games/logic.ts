import { Game, Player } from './entities'

import { Card } from './cards'

export const newGame = () => {
  const game = Game.create()

  for (let i = 0; i < 6; i++) {
    game.players[0].hand = game.deckOfCards.slice(1)
    game.players[1].hand = game.deckOfCards.slice(1)
  }
  
  game.trumpCard = game.deckOfCards.slice(1)[0]
  game.deckOfCards.push(game.trumpCard)

  return game.save
}

export const attack = (game: Game, player: Player, card: Card) => {
  if (game.onTable) throw new Error("table is not empty")

  const playerCardIndex = player.hand.findIndex(handCard => handCard == card)
  const playerCard = player.hand.slice(playerCardIndex)[0]

  game.onTable = playerCard
  
  return game.save()
}

export const defend = (game: Game, player: Player, card: Card) => {
  if (!game.onTable) throw new Error("table is empty")

  const playerCardIndex = player.hand.findIndex(handCard => handCard == card)
  const playerCard = player.hand.slice(playerCardIndex)[0]

  if ((game.onTable.suit != playerCard.suit) && (playerCard.suit != game.trumpCard.suit)) {
    // suits do not match AND player card is not trump
    throw new Error("suits do not match")
  } else if ((game.onTable.value && playerCard.value) && game.onTable.value >= playerCard.value) {
    // card on table is of a bigger value than player's card
    throw new Error("card value is lower than card on a table")
  }

  game.onTable = {}

  return game.save()
}

// canDefend returns an arary of cards which possibly can be used for defense.
export const canDefend = (game: Game, player: Player) => {
  if (!game.onTable) throw new Error("table is empty")

  return player.hand.filter(card => {
    if ((game.onTable.suit != card.suit) && (card.suit != game.trumpCard.suit)) {
      // suits do not match AND player card is not trump
      return false
    } else if ((game.onTable.value && card.value) && game.onTable.value >= card.value) {
      // card on table is of a bigger value than player's card
      return false
    }
    return true
  })
}



export const takeCards = (game: Game) => {
  while (true) {
    if (game.deckOfCards.length == 0) break
    if (game.players[0].hand.length <= 6) game.players[0].hand.push(game.deckOfCards.slice(1)[0])

    if (game.deckOfCards.length == 0) break
    if (game.players[1].hand.length <= 6) game.players[1].hand.push(game.deckOfCards.slice(1)[0])
  }
  return game.save()
}