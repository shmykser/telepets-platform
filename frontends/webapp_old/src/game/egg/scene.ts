import Phaser from 'phaser'
import { GAME_CONFIG, EnemyKind } from './config'

export class EggScene extends Phaser.Scene {
  egg!: Phaser.GameObjects.Text & { hp: number, maxHp: number }
  trees!: Phaser.GameObjects.Group
  enemies!: Phaser.GameObjects.Group

  constructor() { super('EggScene') }

  create() {
    const w = this.scale.width
    const h = this.scale.height
    this.add.rectangle(w/2, h/2, w, h, 0x0b1220)
    this.egg = this.add.text(w/2, h - GAME_CONFIG.egg.yOffsetFromBottom, '🥚', { fontSize: '64px' }).setOrigin(0.5) as any
    this.egg.maxHp = GAME_CONFIG.egg.maxHealth
    this.egg.hp = GAME_CONFIG.egg.maxHealth

    this.trees = this.add.group()
    this.enemies = this.add.group()

    // периодический спавн
    this.time.addEvent({ delay: 1500, loop: true, callback: () => this.spawnRandomEnemy() })
  }

  placeTree(x: number, y: number) {
    const t = this.add.text(x, y, '🌳', { fontSize: '80px' }).setOrigin(0.5) as any
    t.maxHp = GAME_CONFIG.tree.maxHealth
    t.hp = GAME_CONFIG.tree.maxHealth
    t.damage = GAME_CONFIG.tree.damage
    this.trees.add(t)
  }

  spawnRandomEnemy() {
    const kinds: EnemyKind[] = ['ant', 'beetle', 'spider']
    const kind = kinds[Math.floor(Math.random() * kinds.length)]
    const w = this.scale.width
    const x = Phaser.Math.Between(GAME_CONFIG.world.marginSafePx, w - GAME_CONFIG.world.marginSafePx)
    this.spawnEnemy(kind, x, -20)
  }

  spawnEnemy(kind: EnemyKind, x: number, y: number) {
    const cfg = GAME_CONFIG.enemies[kind]
    const emoji = cfg.emoji
    const e = this.add.text(x, y, emoji, { fontSize: '32px' }).setOrigin(0.5) as any
    e.kind = kind
    e.maxHp = cfg.health
    e.hp = cfg.health
    e.damage = cfg.damage
    e.vx = 0
    e.vy = cfg.speed
    e.t = 0
    this.enemies.add(e)
  }

  preUpdate(time: number, delta: number): void {
    const dt = delta / 1000
    const h = this.scale.height
    const w = this.scale.width

    // движение и поведение
    this.enemies.getChildren().forEach((obj: any) => {
      const kind: EnemyKind = obj.kind
      obj.t += dt
      if (kind === 'ant') {
        const sin = GAME_CONFIG.enemies.ant.sin
        obj.x += Math.sin(obj.t * sin.frequency) * (sin.amplitude * dt)
        obj.y += GAME_CONFIG.enemies.ant.speed * dt
      } else if (kind === 'beetle') {
        obj.y += GAME_CONFIG.enemies.beetle.speed * dt
      } else if (kind === 'spider') {
        // простое избегание деревьев
        const avoidR = GAME_CONFIG.enemies.spider.avoidRadius
        let ax = 0
        this.trees.getChildren().forEach((t: any) => {
          const dx = obj.x - t.x
          const dy = obj.y - t.y
          const d = Math.hypot(dx, dy)
          if (d < avoidR && d > 1) ax += (dx / d) * 60 * dt
        })
        obj.x = Phaser.Math.Clamp(obj.x + ax, GAME_CONFIG.world.marginSafePx, w - GAME_CONFIG.world.marginSafePx)
        obj.y += GAME_CONFIG.enemies.spider.speed * dt
      }
    })

    // коллизии: враги с деревьями
    this.enemies.getChildren().forEach((eObj: any) => {
      this.trees.getChildren().forEach((tObj: any) => {
        const d = Phaser.Math.Distance.Between(eObj.x, eObj.y, tObj.x, tObj.y)
        if (d < 36) {
          // урон по дереву
          tObj.hp -= 30 * dt
          if (tObj.hp <= 0) { tObj.destroy(); this.trees.remove(tObj) }

          // особенность жука — сносит одно препятствие
          if (eObj.kind === 'beetle') {
            if (!eObj._bulldozed) { eObj._bulldozed = 1; } else { eObj.vy = 0 }
          } else {
            eObj.vy = 0
          }
        }
      })
      // движение вниз после обработки коллизий
      if (eObj.vy > 0) eObj.y += eObj.vy * dt
    })

    // коллизия с яйцом
    this.enemies.getChildren().forEach((eObj: any) => {
      const d = Phaser.Math.Distance.Between(eObj.x, eObj.y, this.egg.x, this.egg.y)
      if (d < 42) {
        this.egg.hp = Math.max(0, this.egg.hp - eObj.damage)
        eObj.destroy(); this.enemies.remove(eObj)
      }
    })

    // удаление вышедших за экран
    this.enemies.getChildren().forEach((eObj: any) => {
      if (eObj.y > h + 40) { eObj.destroy(); this.enemies.remove(eObj) }
    })
  }
}



