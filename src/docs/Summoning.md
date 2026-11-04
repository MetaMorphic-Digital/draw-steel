The Draw Steel system supports several distinct but related mechanisms of specifying summoning. All of these allow users to place a number of tokens on the map; right-clicking will skip that placement. In general the summoning system works by specifying compendium actors; if a matching world actor is not available, the compendium actor will be imported and used as the base.

<div class="notification warning">Users must have the "Create Tokens" and typically the "Create Actors" permissions to summon. These are not enabled for players by default.</div>

## Standard Summoning

Abilities can have a "Summon" special effect where you specify the UUIDs to summon & count. If multiple actors are specified, a dialog will appear to pick between them. Abilities with a Summon special effect add a button to the ability use message that can be clicked to perform the summoning.

## Companion Summoning

The Beastheart class uses Companion summoning, which uses the Companion Choice advancement to pick the companion and which can be summoned via the summon enricher [&ZeroWidthSpace;[/summon type=companion]]. All of the Beastheart's companion abilities are copied over to the companion as part of this process; other functionality is handled as part of the Companion's own advancements.

## Portfolio Summoning

The Summoner class uses Portfolio summoning, which integrates Summon Choice advancements with the Summon (Portfolio) special effect. Summon choice advancements not only specify actors to pick from while summoning, but allow you to add in level-gated items and effects that will be given to the summoned actors. These additional items and effects are added to the summoned actors, not the base one, so the summoned actors will always have the right bonuses. Active effect change values are evaluated if possible.

Furthermore, the summoned actors will be added to the currently active combat and if there is an active GM, will be added to appropriate combat groups. The current HP of any minion squads are similarly appropriately adjusted.

## Enrichers

For non-ability items that need to summon, the `[[/summon]]` enricher is the best method.

It is not possible to summon actors sourced from compendiums in a context with no summoner, e.g., in a generic Chat Message.
- [&ZeroWidthSpace;[/summon Compendium.draw-steel.monsters.Actor.5oS4rixqbIcsziNm]]: Summon an Abyssal Hyena. World actors are also supported.
- [&ZeroWidthSpace;[/summon actor=Compendium.draw-steel.monsters.Actor.5oS4rixqbIcsziNm]]: You can specify the actor to summon.
- [&ZeroWidthSpace;[/summon Compendium.draw-steel.monsters.Actor.5oS4rixqbIcsziNm count=3]]: You can summon more than one actor at a time by specifying the count.
- [&ZeroWidthSpace;[/summon type=companion]]: Perform a companion summon.
- [&ZeroWidthSpace;[/summon portfolio=call-forth]]: Perform a portfolio summon using the portfolio for the identified ability.
- [&ZeroWidthSpace;[/summon portfolio=call-forth signatureOnly=true]]: Perform a portfolio summon but restrict to signature minions in the portfolio.
- [&ZeroWidthSpace;[/summon Actor.5oS4rixqbIcsziNm summoner=Actor.k0hqADu4kFGzDQ9z]]: Specify an actor as the summoner by providing their UUID. Summoner should be a world actor.
