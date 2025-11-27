Power Roll Effects are a way for Abilities to specify the results of each tier.

## General Info

All power roll effects support picking a unique name and image to help distinguish them on the sheet.

## Damage

Damage effects allow specifying the damage amount (as a formula that takes both dice and roll data), all possible damage types, and properties for that damage. If a damage effect specifies more than one damage type, users will be prompted to pick the damage type as part of the ability usage. The text of the effect is automatically determined from these values.

## Applied Effects

Applied effects allow abilities to apply conditions to actors. This application is not fully automated; the owners of those actors must use the "Apply Effect" button to execute this. Each tier can have any number of effects, including both canonical status conditions as well as custom effects. The "Create Custom Effect" button will create a new ActiveEffect under the "Applied Effects" section of the item sheet; if you create a custom effect but no longer wish to use it, it must be fully deleted from the ability via its Effects tab.

## Forced Movement

Forced Movement effects allow specifying the direction and distance of an ability that pushes, pulls, or slides. There is currently no automation for this feature; owners of the appropriate tokens must apply the position changes themselves.

You can specify bonuses for each type of forced movement (push, pull, and slide). These bonuses are added to the base distance when calculating the final movement amount. The bonuses apply only to their matching movement type. See **Ability Modifiers** under **Active Effects** for details.

## Other

The Other type is a catch-all for anything that does not fit into the other categories and includes just text displays.
