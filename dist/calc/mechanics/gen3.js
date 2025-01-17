"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;

var items_1 = require("../items");
var result_1 = require("../result");
var items_2 = require("../items");
var util_1 = require("./util");
var util_2 = require("../util");
function calculateADV(gen, attacker, defender, move, field) {
    var _a;
    (0, util_1.checkAirLock)(attacker, field);
    (0, util_1.checkAirLock)(defender, field);
    (0, util_1.checkForecast)(attacker, field.weather);
    (0, util_1.checkForecast)(defender, field.weather);
    (0, util_1.checkIntimidate)(gen, attacker, defender);
    (0, util_1.checkIntimidate)(gen, defender, attacker);
    (0, util_1.checkSearchEngine)(defender, attacker);
    (0, util_1.checkSearchEngine)(attacker, defender);
    (0, util_1.checkInflate)(attacker);
    (0, util_1.checkInflate)(defender);
    attacker.stats.spe = (0, util_1.getFinalSpeed)(gen, attacker, field, field.attackerSide);
    defender.stats.spe = (0, util_1.getFinalSpeed)(gen, defender, field, field.defenderSide);
    var desc = {
        attackerName: attacker.name,
        moveName: move.name,
        defenderName: defender.name
    };
    var result = new result_1.Result(gen, attacker, defender, move, field, 0, desc);
    if (move.category === 'Status' && !move.named('Nature Power')) {
        return result;
    }
    if (field.defenderSide.isProtected) {
        desc.isProtected = true;
        return result;
    }
    if (move.named('Weather Ball')) {
        move.type =
            field.hasWeather('Sun') ? 'Fire'
                : field.hasWeather('Rain') ? 'Water'
                    : field.hasWeather('Sand') ? 'Rock'
                        : field.hasWeather('Hail') ? 'Ice'
                            : 'Normal';
        move.category = move.type === 'Rock' ? 'Physical' : 'Special';
        desc.weather = field.weather;
        desc.moveType = move.type;
        desc.moveBP = move.bp;
    }
    else if (move.named('Primal Burst') && attacker.item && attacker.item.includes('Orb')) {
        move.type = (0, items_2.getOrbType)(attacker.item);
    }
    if (attacker.hasAbility('Melody Allegretto') && move.flags.sound) {
        move.priority = 1;
        desc.attackerAbility = attacker.ability;
    }
    var typeEffectivenessPrecedenceRules = [
        'Normal',
        'Fire',
        'Water',
        'Electric',
        'Grass',
        'Ice',
        'Fighting',
        'Poison',
        'Ground',
        'Flying',
        'Psychic',
        'Bug',
        'Rock',
        'Ghost',
        'Dragon',
        'Dark',
        'Steel',
    ];
    var firstDefenderType = defender.types[0];
    var secondDefenderType = defender.types[1];
    if (secondDefenderType && firstDefenderType !== secondDefenderType) {
        var firstTypePrecedence = typeEffectivenessPrecedenceRules.indexOf(firstDefenderType);
        var secondTypePrecedence = typeEffectivenessPrecedenceRules.indexOf(secondDefenderType);
        if (firstTypePrecedence > secondTypePrecedence) {
            _a = __read([secondDefenderType, firstDefenderType], 2), firstDefenderType = _a[0], secondDefenderType = _a[1];
        }
    }
    var isBoneMaster = attacker.hasAbility('Bone Master') && !!move.flags.bone;
    var type1Effectiveness = (0, util_1.getMoveEffectiveness)(gen, move, firstDefenderType, field.defenderSide.isForesight, false, false, isBoneMaster);
    var type2Effectiveness = secondDefenderType
        ? (0, util_1.getMoveEffectiveness)(gen, move, secondDefenderType, field.defenderSide.isForesight, false, false, isBoneMaster)
        : 1;
    var typeEffectiveness = type1Effectiveness * type2Effectiveness;
    if (typeEffectiveness === 0) {
        return result;
    }
    if (defender.hasAbility('Cloud Guard') && defender.hasType('Flying') &&
        gen.types.get((0, util_2.toID)(move.type)).effectiveness['Flying'] > 1) {
        typeEffectiveness /= 2;
        desc.defenderAbility = defender.ability;
    }
    if ((defender.hasAbility('Flash Fire', 'Flame Absorb') && move.hasType('Fire')) ||
        (move.hasType('Bug') && defender.hasAbility('Bugcatcher')) ||
        (move.hasType('Ground') && defender.hasAbility('Clay Construction')) ||
        (!(defender.hasAbility('Bone Master') && move.flags.bone) &&
            (defender.hasAbility('Levitate') || (defender.hasAbility('Inflate') && defender.abilityOn)) && move.hasType('Ground')) ||
        (defender.hasAbility('Volt Absorb') && move.hasType('Electric')) ||
        (defender.hasAbility('Water Absorb') && move.hasType('Water')) ||
        (defender.hasAbility('Wonder Guard') && !move.hasType('???') && typeEffectiveness <= 1) ||
        (defender.hasAbility('Soundproof') && move.flags.sound) ||
        (move.flags.blade && defender.hasAbility('Bladeproof')) ||
        (move.hasType('Ghost', 'Dark') && defender.hasAbility('Baku Shield')) ||
        (move.hasType('Poison') && defender.hasAbility('Acid Absorb')) ||
        (move.hasType('Dark') && defender.hasAbility('Karma')) ||
        (defender.named('Kiwuit') && defender.hasAbility('Ambrosia') && defender.item && gen.items.get((0, util_2.toID)(defender.item)).isBerry &&
            (0, items_1.getNaturalGift)(gen, defender.item).t === move.type)) {
        desc.defenderAbility = defender.ability;
        return result;
    }
    desc.HPEVs = "".concat(defender.evs.hp, " HP");
    var fixedDamage = (0, util_1.handleFixedDamageMoves)(attacker, move);
    if (fixedDamage) {
        result.damage = fixedDamage;
        return result;
    }
    if (move.named('Cat Burglary')) {
        var stat = void 0;
        for (stat in defender.boosts) {
            if (defender.boosts[stat] > 0) {
                attacker.boosts[stat] +=
                    attacker.hasAbility('Contrary') ? -defender.boosts[stat] : defender.boosts[stat];
                if (attacker.boosts[stat] > 6)
                    attacker.boosts[stat] = 6;
                if (attacker.boosts[stat] < -6)
                    attacker.boosts[stat] = -6;
                attacker.stats[stat] = (0, util_1.getModifiedStat)(attacker.rawStats[stat], attacker.boosts[stat]);
                defender.boosts[stat] = 0;
                defender.stats[stat] = defender.rawStats[stat];
            }
        }
    }
    if (move.hits > 1) {
        desc.hits = move.hits;
    }
    var bp = move.bp;
    switch (move.name) {
        case 'Flail':
        case 'Reversal':
        case 'Shadow Vengeance':
            var p = Math.floor((48 * attacker.curHP()) / attacker.maxHP());
            bp = p <= 1 ? 200 : p <= 4 ? 150 : p <= 9 ? 100 : p <= 16 ? 80 : p <= 32 ? 40 : 20;
            desc.moveBP = bp;
            break;
        case 'Eruption':
        case 'Icefall':
        case 'Water Spout':
            bp = Math.max(1, Math.floor((150 * attacker.curHP()) / attacker.maxHP()));
            desc.moveBP = bp;
            break;
        case 'Low Kick':
            var w = defender.weightkg;
            bp = w >= 200 ? 120 : w >= 100 ? 100 : w >= 50 ? 80 : w >= 25 ? 60 : w >= 10 ? 40 : 20;
            desc.moveBP = bp;
            break;
        case 'Infernal Parade':
        case 'Shadow Sorcery':
            bp = move.bp * (defender.status ? 2 : 1);
            desc.moveBP = bp;
            break;
        case 'Snuggle Bug':
            bp = 20 + 20 * (0, util_1.countBoosts)(gen, attacker.boosts);
            desc.moveBP = bp;
            break;
        case 'Shadow Punish':
            bp = 55 + 30 * (0, util_1.countBoosts)(gen, defender.boosts);
            desc.moveBP = bp;
            break;
        case 'Facade':
            if (attacker.hasStatus('par', 'psn', 'tox', 'brn')) {
                bp = move.bp * 2;
                desc.moveBP = bp;
            }
            break;
        case 'Nature Power':
            move.category = 'Physical';
            bp = 60;
            desc.moveName = 'Swift';
            break;
        default:
            bp = move.bp;
    }
    if (bp === 0) {
        return result;
    }
    var isPhysical = move.category === 'Physical';
    var attackStat = isPhysical ? 'atk' : 'spa';
    desc.attackEVs = (0, util_1.getEVDescriptionText)(gen, attacker, attackStat, attacker.nature);
    if (move.named('Combardment') && (defender.stats.def > defender.stats.spd)) {
        move.overrideDefensiveStat = 'spd';
    }
    var defenseStat = move.overrideDefensiveStat || move.category === 'Physical' ? 'def' : 'spd';
    desc.defenseEVs = (0, util_1.getEVDescriptionText)(gen, defender, defenseStat, defender.nature);
    var at = attacker.rawStats[attackStat];
    var df = defender.rawStats[defenseStat];
    if (isPhysical && attacker.hasAbility('Huge Power', 'Pure Power')) {
        at *= 2;
        desc.attackerAbility = attacker.ability;
    }
    if (!attacker.hasItem('Sea Incense') && move.hasType((0, items_1.getItemBoostType)(attacker.item))) {
        at = Math.floor(at * 1.1);
        desc.attackerItem = attacker.item;
    }
    else if (attacker.hasItem('Sea Incense') && move.hasType('Water')) {
        at = Math.floor(at * 1.05);
        desc.attackerItem = attacker.item;
    }
    else if ((isPhysical && attacker.hasItem('Choice Band')) ||
        (!isPhysical && attacker.hasItem('Soul Dew') && attacker.named('Latios', 'Latias'))) {
        at = Math.floor(at * 1.5);
        desc.attackerItem = attacker.item;
    }
    else if ((!isPhysical && attacker.hasItem('Deep Sea Tooth') && attacker.named('Clamperl')) ||
        (!isPhysical && attacker.hasItem('Light Ball') && attacker.named('Pikachu')) ||
        (isPhysical && attacker.hasItem('Thick Club') && attacker.named('Cubone', 'Marowak'))) {
        at *= 2;
        desc.attackerItem = attacker.item;
    }
    if (!isPhysical && defender.hasItem('Soul Dew') && defender.named('Latios', 'Latias')) {
        df = Math.floor(df * 1.5);
        desc.defenderItem = defender.item;
    }
    else if ((!isPhysical && defender.hasItem('Deep Sea Scale') && defender.named('Clamperl')) ||
        (isPhysical && defender.hasItem('Metal Powder') && defender.named('Ditto'))) {
        df *= 2;
        desc.defenderItem = defender.item;
    }
    if (defender.hasAbility('Thick Fat') && (move.hasType('Fire', 'Ice'))) {
        at = Math.floor(at / 2);
        desc.defenderAbility = defender.ability;
    }
    else if (isPhysical && defender.hasAbility('Marvel Scale') && defender.status) {
        df = Math.floor(df * 1.5);
        desc.defenderAbility = defender.ability;
    }
    if ((isPhysical &&
        (attacker.hasAbility('Hustle') || (attacker.hasAbility('Guts') && attacker.status))) ||
        ((attacker.curHP() <= attacker.maxHP() / 4) && (attacker.hasAbility('Adrenalize'))) ||
        (!isPhysical && attacker.abilityOn && attacker.hasAbility('Plus', 'Minus'))) {
        at = Math.floor(at * 1.5);
        desc.attackerAbility = attacker.ability;
    }
    else if ((attacker.curHP() <= attacker.maxHP() / 3 &&
        ((attacker.hasAbility('Overgrow') && move.hasType('Grass')) ||
            (attacker.hasAbility('Blaze') && move.hasType('Fire')) ||
            (attacker.hasAbility('Torrent') && move.hasType('Water')) ||
            (attacker.hasAbility('Swarm') && move.hasType('Bug')))) ||
        (attacker.hasAbility('Escape Artist') && move.named('Flip Turn', 'U-turn', 'Volt Switch', 'Shadow Pivot', 'Propulsion Shot'))) {
        bp = Math.floor(bp * 1.5);
        desc.attackerAbility = attacker.ability;
    }
    if (move.named('Explosion', 'Self-Destruct')) {
        df = Math.floor(df / 2);
    }
    var isCritical = move.isCrit && !defender.hasAbility('Battle Armor', 'Shell Armor');
    var attackBoost = attacker.boosts[attackStat];
    var defenseBoost = defender.boosts[defenseStat];
    if (attackBoost > 0 || (!isCritical && attackBoost < 0)) {
        at = (0, util_1.getModifiedStat)(at, attackBoost);
        desc.attackBoost = attackBoost;
    }
    if (defenseBoost < 0 || (!isCritical && defenseBoost > 0)) {
        df = (0, util_1.getModifiedStat)(df, defenseBoost);
        desc.defenseBoost = defenseBoost;
    }
    var lv = attacker.level;
    var baseDamage = Math.floor(Math.floor((Math.floor((2 * lv) / 5 + 2) * at * bp) / df) / 50);
    if (attacker.hasStatus('brn') && isPhysical && !attacker.hasAbility('Guts')) {
        baseDamage = Math.floor(baseDamage / 2);
        desc.isBurned = true;
    }
    if (!isCritical) {
        var screenMultiplier = field.gameType !== 'Singles' ? 2 / 3 : 1 / 2;
        if (isPhysical && field.defenderSide.isReflect) {
            baseDamage = Math.floor(baseDamage * screenMultiplier);
            desc.isReflect = true;
        }
        else if (!isPhysical && field.defenderSide.isLightScreen) {
            baseDamage = Math.floor(baseDamage * screenMultiplier);
            desc.isLightScreen = true;
        }
    }
    if (move.named('Pursuit') && field.defenderSide.isSwitching === 'out') {
        baseDamage = Math.floor(baseDamage * 2);
        desc.isSwitching = 'out';
    }
    if (field.gameType !== 'Singles' && move.target === 'allAdjacentFoes') {
        baseDamage = Math.floor(baseDamage / 2);
    }
    if ((field.hasWeather('Sun') && move.hasType('Fire')) ||
        (field.hasWeather('Rain') && move.hasType('Water')) ||
        (field.hasWeather('Miasma') && move.hasType('Poison'))) {
        baseDamage = Math.floor(baseDamage * 1.5);
        desc.weather = field.weather;
    }
    else if ((field.hasWeather('Sun') && move.hasType('Water')) ||
        (field.hasWeather('Rain') && move.hasType('Fire')) ||
        (move.named('Solar Beam') && field.hasWeather('Rain', 'Sand', 'Hail'))) {
        baseDamage = Math.floor(baseDamage / 2);
        desc.weather = field.weather;
    }
    if (attacker.hasAbility('Flash Fire') && attacker.abilityOn && move.hasType('Fire')) {
        baseDamage = Math.floor(baseDamage * 1.5);
        desc.attackerAbility = 'Flash Fire';
    }
    if (attacker.hasAbility('Corona') && move.hasType('Fire')) {
        baseDamage = Math.floor(baseDamage * 1.5);
    }
    baseDamage = (move.category === 'Physical' ? Math.max(1, baseDamage) : baseDamage) + 2;
    if (isCritical) {
        baseDamage *= 2;
        desc.isCritical = true;
    }
    if (move.named('Weather Ball') && field.weather) {
        baseDamage *= 2;
        desc.moveBP = bp * 2;
    }
    if (field.attackerSide.isHelpingHand) {
        baseDamage = Math.floor(baseDamage * 1.5);
        desc.isHelpingHand = true;
    }
    if (move.hasType.apply(move, __spreadArray([], __read(attacker.types), false))) {
        baseDamage = Math.floor(baseDamage * 1.5);
    }
    baseDamage = Math.floor(baseDamage * typeEffectiveness);
    if (defender.hasAbility('Bagwormicade') && typeEffectiveness > 1) {
        baseDamage = Math.floor(baseDamage * 0.5);
    }
    if (defender.hasAbility('Enfeebling Venom') && attacker.hasStatus('psn', 'tox')) {
        baseDamage = Math.floor(baseDamage * 0.5);
    }
    result.damage = [];
    for (var i = 85; i <= 100; i++) {
        result.damage[i - 85] = Math.max(1, Math.floor((baseDamage * i) / 100));
    }
    if (move.hits > 1) {
        var _loop_1 = function (times) {
            var damageMultiplier = 85;
            result.damage = result.damage.map(function (affectedAmount) {
                if (times) {
                    var newFinalDamage = Math.max(1, Math.floor((baseDamage * damageMultiplier) / 100));
                    damageMultiplier++;
                    return affectedAmount + newFinalDamage;
                }
                return affectedAmount;
            });
        };
        for (var times = 0; times < move.hits; times++) {
            _loop_1(times);
        }
    }
    return result;
}
exports.calculateADV = calculateADV;
//# sourceMappingURL=gen3.js.map