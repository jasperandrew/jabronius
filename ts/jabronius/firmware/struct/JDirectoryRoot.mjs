import { JDirectory } from './JDirectory.mjs';

export class JDirectoryRoot extends JDirectory {
	constructor() {
		super();

		// Public Fields //////////////////
		this.isRoot = () => true;
		this.getName = () => '';
		this.getParent = () => null;
	}
}