import selectors
import asyncio
import uvicorn

loop = asyncio.SelectorEventLoop(selectors.SelectSelector())
asyncio.set_event_loop(loop)

config = uvicorn.Config("app.main:app", host="0.0.0.0", port=8000, loop="none")
server = uvicorn.Server(config)
loop.run_until_complete(server.serve())
