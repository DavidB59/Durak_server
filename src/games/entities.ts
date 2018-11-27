import { BaseEntity, PrimaryGeneratedColumn, Column, Entity, Index, OneToMany, ManyToOne } from 'typeorm'
import User from '../users/entity'
import {deckOfCards, Card} from './cards'

type Status = 'pending' | 'started' | 'finished'

@Entity()
export class Game extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number

  @Column('json', {default: deckOfCards})
  deckOfCards: Card[]

  @Column('text', {default: 'pending'})
  status: Status

  @Column('json', {default: {}})
  trumpCard: Card

  @Column('json', {default: {}})
  onTable: Card
  
  // this is a relation, read more about them here:
  // http://typeorm.io/#/many-to-one-one-to-many-relations
  @OneToMany(_ => Player, player => player.game, {eager:true})
  players: Player[]
}

@Entity()
@Index(['game', 'user'], {unique:true})
export class Player extends BaseEntity {

  @PrimaryGeneratedColumn()
  id?: number

  @ManyToOne(_ => User, user => user.players)
  user: User

  @ManyToOne(_ => Game, game => game.players)
  game: Game

  @Column('json', {default: []})
  hand: Card[]

  @Column()
  userId: number
}
