import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const targetUrl = searchParams.get("url");
        const download = searchParams.get("download");
        const filename = searchParams.get("filename") || "document.pdf";
        if (!targetUrl) {
            return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
        }

        const upstream = await fetch(targetUrl, {
            headers: {
                "Accept": "*/*"
            }
        });
        if (!upstream.ok) {
            const text = await upstream.text().catch(() => "");
            return NextResponse.json(
                { error: "Upstream fetch failed", status: upstream.status, details: text.slice(0, 500) },
                { status: 502 }
            );
        }

        const arrayBuffer = await upstream.arrayBuffer();
        const headers = new Headers();
        headers.set("Content-Type", upstream.headers.get("Content-Type") || "application/pdf");
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        if (download === "1") {
            headers.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        }

        return new NextResponse(arrayBuffer, { status: 200, headers });
    } catch (error: any) {
        return NextResponse.json(
            { error: "Proxy error", details: error?.message || String(error) },
            { status: 500 }
        );
    }
}