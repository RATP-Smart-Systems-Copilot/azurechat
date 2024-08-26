import { Config } from "@markdoc/markdoc";
import { citation } from "./citation";
import { fence } from "./code-block";
import { paragraph } from "./paragraph";
import { link } from "./link";
import { list } from "./list";
import { table } from "./table";
import { thead } from "./thead";
import { tbody } from "./tbody";
import { th } from "./th";
import { td } from "./td";
import { tr } from "./tr";

export const citationConfig: Config = {
  nodes: {
    paragraph,
    fence,
    link,
    list,
    table,
    thead,
    tbody,
    th,
    td,
    tr,
  },
  tags: {
    citation,
  },
};
