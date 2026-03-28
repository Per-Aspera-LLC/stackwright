import { DynamicPage } from "@stackwright/core";
import type { GetStaticProps } from "next";
import fs from "fs";
import path from "path";

export default DynamicPage;

export const getStaticProps: GetStaticProps = async () => {
    const dir = path.join(process.cwd(), "public", "stackwright-content");
    const pageContent = JSON.parse(fs.readFileSync(path.join(dir, "_root.json"), "utf8"));
    const siteConfig = JSON.parse(fs.readFileSync(path.join(dir, "_site.json"), "utf8"));
    return { props: { pageContent, siteConfig } };
};
