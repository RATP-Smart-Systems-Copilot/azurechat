import { Config } from "@markdoc/markdoc";
import { citation } from "./citation";
import { fence } from "./code-block";
import { paragraph } from "./paragraph";
import { link } from "./link";
import { list } from "./list";

export const citationConfig: Config = {
  nodes: {
    paragraph,
    fence,
    link,
    list,
  },
  tags: {
    citation,
  },
};
