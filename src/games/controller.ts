import {
  JsonController, Authorized, CurrentUser, Post, Param, BadRequestError, HttpCode, NotFoundError, ForbiddenError, Get,
  Body, Patch
} from 'routing-controllers'
import User from '../users/entity'
import { Game, Player } from './entities'
import { } from './logic'
import { deckOfCards } from './cards'
import { Validate } from 'class-validator'
import { io } from '../index'
import { Card } from './cards'
import { attack, canDefend, defend, takeCardFromTable, takeCards, isFinished} from './logic'


@JsonController()
export default class GameController {
  @Authorized()
  @Post('/games')
  @HttpCode(201)
  async createGame(
    @CurrentUser() user: User
  ) {
    const entity = await Game.create()
    const shuffledDeck = deckOfCards()
    entity.deckOfCards = shuffledDeck
    entity.trumpCard = entity.deckOfCards[0]

    const newHand: Card[] | undefined[] = []
    for (let i = 0; i < 6; i++) {
      newHand[i] = entity.deckOfCards.pop()
      await entity.save()
    }

    await Player.create({
      game: entity,
      user,
      hand: newHand
    }).save()

    const game = await Game.findOneById(entity.id)

    io.emit('action', {
      type: 'ADD_GAME',
      payload: game
    })

    return game
  }

  @Authorized()
  @Post('/games/:id([0-9]+)/players')
  @HttpCode(201)
  async joinGame(
    @CurrentUser() user: User,
    @Param('id') gameId: number
  ) {
    const game = await Game.findOneById(gameId)
    if (!game) throw new BadRequestError(`Game does not exist`)
    if (game.status !== 'pending') throw new BadRequestError(`Game is already started`)

    game.status = 'started'
    await game.save()

    const newHand: Card[] | undefined[] = []
    for (let i = 0; i < 6; i++) {
      newHand[i] = game.deckOfCards.pop()
    }

    const player = await Player.create({
      game,
      user,
      hand: newHand
    }).save()

    io.emit('action', {
      type: 'UPDATE_GAME',
      payload: await Game.findOneById(game.id)
    })

    return player
  }

 

  // // @Authorized()
  // // the reason that we're using patch here is because this request is not idempotent
  // // http://restcookbook.com/HTTP%20Methods/idempotency/
  // // try to fire the same requests twice, see what happens
  // // @Patch('/games/:id([0-9]+)')
  // // async updateGame(
  // //   @CurrentUser() user: User,
  // //   @Param('id') gameId: number,
  // //   @Body() update: GameUpdate
  // // ) {
  // //   const game = await Game.findOneById(gameId)
  // //   if (!game) throw new NotFoundError(`Game does not exist`)

  // //   const player = await Player.findOne({ user, game })

  // //   if (!player) throw new ForbiddenError(`You are not part of this game`)
  // //   if (game.status !== 'started') throw new BadRequestError(`The game is not started yet`)
  // //   if (player.symbol !== game.turn) throw new BadRequestError(`It's not your turn`)
  // //   if (!isValidTransition(player.symbol, game.board, update.board)) {
  // //     throw new BadRequestError(`Invalid move`)
  // //   }    

  //   // const winner = calculateWinner(update.board)
  //   // if (winner) {
  //   //   game.winner = winner
  //   //   game.status = 'finished'
  //   // }
  //   // else if (finished(update.board)) {
  //   //   game.status = 'finished'
  //   // }
  //   // else {
  //   //   game.turn = player.symbol === 'x' ? 'o' : 'x'
  //   // }
  //   // game.board = update.board
  //   // await game.save()

  //   // io.emit('action', {
  //   //   type: 'UPDATE_GAME',
  //   //   payload: game
  //   // })

  //   // return game
  // }

  // @Authorized()
  @Get('/games/:id([0-9]+)')
  getGame(
    @Param('id') id: number
  ) {
    return Game.findOneById(id)
  }

  @Authorized()
  @Patch('/games/:id([0-9]+)/attack')
  async attack(
    @CurrentUser() user: User,
    @Param('id') gameId: number,
    @Body() cardCode: Card["code"],
  ) {
    console.log('Did we get called?')
    const game = await Game.findOneById(gameId)
    if (!game) throw new NotFoundError(`Game does not exist`)

    const player = await Player.findOne({ user, game })

    if (!player) throw new ForbiddenError(`You are not part of this game`)
    if (game.status !== 'started') throw new BadRequestError(`The game is not started yet`)
    
    attack(game, player, cardCode)

    switch(game.turn) {
      case 0: game.turn = 1
      break
      case 1: game.turn = 0
    }

    await player.save()
    await game.save()
    
    // todo
    // io.emit('action', {
    //   type: 'UPDATE_GAME',
    //   payload: game
    // })
    console.log(game)
    return game
  }

  // @Authorized()
  @Get('/games/:id([0-9]+)/cards-to-defend')
  async cardsToDefend(
    @CurrentUser() user: User,
    @Param('id') gameId: number,
  ) {
    const game = await Game.findOneById(gameId)
    if (!game) throw new NotFoundError(`Game does not exist`)

    const player = await Player.findOne({ user, game })

    if (!player) throw new ForbiddenError(`You are not part of this game`)
    if (game.status !== 'started') throw new BadRequestError(`The game is not started yet`)
    return canDefend(game, player)

    //todo
    // io.emit('action', {
    //   type: 'UPDATE_GAME',
    //   payload: game
    // })

    // return game
  }

  // @Authorized()
  @Patch('/games/:id([0-9]+)/defend')
  async defend(
    @CurrentUser() user: User,
    @Param('id') gameId: number,
    @Body() card: Card,
  ) {
    const game = await Game.findOneById(gameId)
    if (!game) throw new NotFoundError(`Game does not exist`)

    const player = await Player.findOne({ user, game })

    if (!player) throw new ForbiddenError(`You are not part of this game`)
    if (game.status !== 'started') throw new BadRequestError(`The game is not started yet`)
    try {
      defend(game, player, card) 
    }
    catch { 
      takeCardFromTable(game, player)
    }
     
    switch (game.turn) {
      case 0: game.turn = 1
        break
      case 1: game.turn = 0
    }

    await game.save()

    //todo
    // io.emit('action', {
    //   type: 'UPDATE_GAME',
    //   payload: game
    // })

    // return game

  }

  // @Authorized()
  @Patch('/games/:id([0-9]+)/defend')
  async takeCards (
    @CurrentUser() user: User,
    @Param('id') gameId: number,
  ) {
    const game = await Game.findOneById(gameId)
    if (!game) throw new NotFoundError(`Game does not exist`)

    const player = await Player.findOne({ user, game })

    if (!player) throw new ForbiddenError(`You are not part of this game`)
    if (game.status !== 'started') throw new BadRequestError(`The game is not started yet`)

    takeCards(game)
    await player.save()
    await game.save()

    //todo
    // io.emit('action', {
    //   type: 'UPDATE_GAME',
    //   payload: game
    // })

    // return game

  }

  // @Authorized()
  @Get('/games')
  getGames() {
    return Game.find()
  }


  // @Authorized()
  @Get('/players')
  getPlayers() {
    return Player.find()
  }
}