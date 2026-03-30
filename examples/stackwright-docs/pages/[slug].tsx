import { DynamicPage } from "@stackwright/core";
import type { GetStaticPaths, GetStaticProps } from "next";
import fs from "fs";
import path from "path";

// Files that should not be treated as page slugs
const EXCLUDED_FILES = ["_site.json", "_root.json", "search-index.json"];

export default DynamicPage;

export const getStaticPaths: GetStaticPaths = async () => {
    const dir = path.join(process.cwd(), "public", "stackwright-content");
    const slugs = fs
        .readdirSync(dir)
        .filter(f => f.endsWith(".json") && !EXCLUDED_FILES.includes(f))
        .map(f => f.replace(/\.json$/, ""));
    return {
        paths: slugs.map(slug => ({ params: { slug } })),
        fallback: "blocking",
    };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const rawSlug = Array.isArray(params?.slug)
        ? params.slug.join("/")
        : (params?.slug ?? "");
    const dir = path.join(process.cwd(), "public", "stackwright-content");

    // Validate slug against known content files to prevent path traversal
    const knownSlugs = fs
        .readdirSync(dir)
        .filter(f => f.endsWith(".json") && !EXCLUDED_FILES.includes(f))
        .map(f => f.replace(/\.json$/, ""));
    const slug = knownSlugs.includes(rawSlug) ? rawSlug : null;

    if (!slug && rawSlug !== "") {
        return { notFound: true };
    }

    const contentFile = slug ? `${slug}.json` : "_root.json";
    const pageContent = JSON.parse(fs.readFileSync(path.join(dir, contentFile), "utf8"));
    const siteConfig = JSON.parse(fs.readFileSync(path.join(dir, "_site.json"), "utf8"));
    return { props: { pageContent, siteConfig } };
};
