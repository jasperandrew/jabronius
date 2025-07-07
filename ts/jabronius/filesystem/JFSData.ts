import { JFSDirectory } from "./JFSDirectory.js";
import { JFSFile, JFSType } from "./JFSFile.js";

export class JFSData extends JFSFile {
   constructor(name: string, address: number, parent: JFSDirectory | null) {
      super(name, JFSType.Data, address, parent);
   }

	toString() { return `${this.name}*`; }
}