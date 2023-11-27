import { useState, useEffect, useRef } from "react"
import styles from "./App.module.css"
import { set, get } from "idb-keyval"

const IDB_KEY = "text"

export default function App() {
	const [messages, setMessages] = useState([])

	const [inputValue, setInputValue] = useState("")
	const [disableButton, setDisableButton] = useState(false)

	const chatMessagesContainerRef = useRef(null)

	let CHATBOT_API_ENDPOINT = "https://chatbot-server.adaptable.app/api/chatbot/chat"

	async function saveTextToDB(text) {
		await set(IDB_KEY, text)
	}

	async function getTextFromDB() {
		const text = await get(IDB_KEY)
		return text
	}

	const handleInputChange = (event) => {
		setInputValue(event.target.value)
	}

	function sanitizedMessages() {
		const sanitizedMessages = messages.map((message) => {
			return { content: message.text }
		})
		return sanitizedMessages
	}

	function sanitizeThisMessage(newMessage) {
		const sanitizedMessage = { content: newMessage.text }
		return sanitizedMessage
	}

	const scrollToBottom = () => {
		chatMessagesContainerRef.current.scrollTo({
			top: chatMessagesContainerRef.current.scrollHeight,
			behavior: "smooth",
		})
	}

	const handleFormSubmit = async (event) => {
		event.preventDefault()

		if (inputValue.trim() !== "") {
			const newMessage = { text: inputValue, sender: "user" }

			setMessages([...messages, newMessage])

			await saveTextToDB(inputValue)
			setInputValue("")

			setDisableButton(true)

			try {
				const chatbotRequest = await fetch(CHATBOT_API_ENDPOINT, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						messages: [
							...sanitizedMessages(),
							sanitizeThisMessage(newMessage),
						],
					}),
				})

				const chatbotResponse = await chatbotRequest.json()

				setTimeout(() =>
					setMessages([
						...messages,
						{ text: inputValue, sender: "user" },
						{ text: chatbotResponse, sender: "bot" },
					])
				)
			} catch (error) {
				console.log(error)
				setInputValue(await getTextFromDB())
				setMessages(messages.slice(0, -1))
			}

			setDisableButton(false)
		}
	}

	useEffect(() => {
		scrollToBottom()
	}, [messages])

	return (
		<div className={styles.chatContainer}>
			<div ref={chatMessagesContainerRef} className={styles.chatMessages}>
				{messages.map((message, index) => (
					<Message key={index} message={message} />
				))}
			</div>
			<form onSubmit={handleFormSubmit} className={styles.chatForm}>
				<input
					type="text"
					value={inputValue}
					onChange={handleInputChange}
					placeholder="Type your message here..."
					className={styles.chatInput}
				/>
				<button
					disabled={disableButton}
					type="submit"
					className={styles.chatSubmit}
				>
					Send
				</button>
			</form>
		</div>
	)
}

function Message({ message }) {
	return (
		<div
			className={`${styles.chatMessage} ${
				message.sender === "bot" ? styles.bot : styles.user
			}`}
		>
			{message.text}
		</div>
	)
}
