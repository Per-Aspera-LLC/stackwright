import { DynamicPage } from "@stackwright/core";
import type { GetStaticPaths, GetStaticProps } from "next";
import fs from "fs";
import path from "path";

export default DynamicPage;

export const getStaticPaths: GetStaticPaths = async () => {
    const dir = path.join(process.cwd(), "public", "stackwright-content");
    const slugs = fs
        .readdirSync(dir)
        .filter(f => f.endsWith(".json") && f !== "_site.json" && f !== "_root.json")
        .map(f => f.replace(/\.json$/, ""));
    return {
        paths: slugs.map(slug => ({ params: { slug } })),
        fallback: "blocking",
    };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const slug = Array.isArray(params?.slug)
        ? params.slug.join("/")
        : (params?.slug ?? "");
    const dir = path.join(process.cwd(), "public", "stackwright-content");
    const contentFile = slug ? `${slug}.json` : "_root.json";
    const pageContent = JSON.parse(fs.readFileSync(path.join(dir, contentFile), "utf8"));
    const siteConfig = JSON.parse(fs.readFileSync(path.join(dir, "_site.json"), "utf8"));
    return { props: { pageContent, siteConfig } };
};
