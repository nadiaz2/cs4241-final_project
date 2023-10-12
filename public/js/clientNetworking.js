import { setOpponentCard, setOpponentID, displayText, resetFields } from "./cardGameHelper.js"
import { global } from "./global.js"

// Public Functions

/**
  * Sends a message to the server
  * @param {string} messageName The name of this message. This serves as a simple indicator about the type of message that you are sending.
  * @param {object} object The object that will be send to clients.
  */
const sendNetworkMessage = function (messageName, object) {
	switch (messageName) {
		case "changeScene":
			currentScene = object
			break

		case "movement":
			currentScene.pos = object
			break
	}
	network.emit(messageName, object)
}

export default sendNetworkMessage


// Socket Initialization
const network = io("/", { forceNew: true })

network.on("spawn", (players) => {
	for (const [id, pos] of Object.entries(players)) {
		spawnRemotePlayer(id, pos)
	}
})

network.on("remoteMovement", (movement) => moveRemotePlayer(movement.id, movement.pos))
network.on("kill", (id) => removeRemotePlayer(id))
network.on("joinGame", (opponent) => {
	go("card")
	setOpponentID(opponent)
	network.emit("joinSubScene", { scene: "card" })
})
network.on("setOpponentCard", (cardInfo) => {
	const result = setOpponentCard(cardInfo)

	let backButton
	switch (result) {
		case "win":
			backButton = displayText("You Win!")
			break

		case "lose":
			backButton = displayText("You Lose...")
			break

		case "tie":
			backButton = displayText("It's a Tie")
			break

		default:
			return
	}

	backButton.onClick(() => {
		resetFields()
		go("dojo")
		sendNetworkMessage("changeScene", { scene: "dojo", pos: global.DOJO_SPAWN })
	})
})

const remotePlayers = {}
let currentScene = { scene: "", pos: {} }
network.on("connect", () => {
	if (currentScene.scene === "") {
		return
	}

	for (const id of Object.keys(remotePlayers)) {
		removeRemotePlayer(id)
	}

	network.emit("setScene", currentScene)
})

// Private Functions

const spawnRemotePlayer = function (id, positon) {
	let x = positon.x //|| SPAWN.x
	let y = positon.y //|| SPAWN.y

	if (remotePlayers[id]) {
		destroy(remotePlayers[id])
	}

	remotePlayers[id] = add([
		sprite("puffle-red"),
		pos(x, y),
		scale(0.5, 0.5),
		anchor("center"),
	])
}

const removeRemotePlayer = function (id) {
	destroy(remotePlayers[id]) // removes player from kaboom
	delete remotePlayers[id] // removes player from map
}

const moveRemotePlayer = function (id, vector) {
	remotePlayers[id].moveTo(vector.x, vector.y)
}
