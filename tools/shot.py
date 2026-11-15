import sys, asyncio
from playwright.async_api import async_playwright
async def main(url,out,w=1600,h=1000,wait=4000):
    async with async_playwright() as p:
        b=await p.chromium.launch(channel="chrome",args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
        pg=await b.new_page(viewport={"width":w,"height":h})
        errs=[]
        pg.on("pageerror",lambda e:errs.append(str(e)))
        pg.on("console",lambda m:errs.append("console."+m.type+": "+m.text) if m.type in("error","warning") else None)
        await pg.goto(url); await pg.wait_for_timeout(wait)
        await pg.screenshot(path=out)
        print("saved",out); print("\n".join(errs[:20]))
        await b.close()
asyncio.run(main(sys.argv[1],sys.argv[2]))
