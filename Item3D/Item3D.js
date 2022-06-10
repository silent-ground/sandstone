import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

import Skinnable from '../Skinnable';

import componentCss from './Item3D.module.less';
import {useRef, useState} from "react";


const Item3DBase = (props) => {
	// This reference will give us direct access to the mesh
	const mesh = useRef();
	// Set up state for the hovered and active state
	const [hovered, setHover] = useState(false);
	const [active, setActive] = useState(false);
	// Rotate mesh every frame, this is outside of React without overhead
	//useFrame(() => (mesh.current.rotation.z += 0.01))

	const shape = new THREE.Shape();

	let sizeX = 15;
	let sizeY = 1.5;
	let radius = 0.1;

	let halfX = sizeX * 0.5 - radius;
	let halfY = sizeY * 0.5 - radius;
	let baseAngle = Math.PI * 0.5;
	shape.absarc(halfX, halfY, radius, baseAngle * 0, baseAngle * 0 + baseAngle);
	shape.absarc(-halfX, halfY, radius, baseAngle * 1, baseAngle * 1 + baseAngle);
	shape.absarc(-halfX, -halfY, radius, baseAngle * 2, baseAngle * 2 + baseAngle);
	shape.absarc(halfX, -halfY, radius, baseAngle * 3, baseAngle * 3 + baseAngle);

	return (
		<group>
			<group position={[0,0,-0.51]}>
				<mesh
					{...props}
					ref={mesh}
					onPointerOver={(event) => setHover(true)}
					onPointerOut={(event) => setHover(false)}
				>
					<extrudeBufferGeometry args={[shape, { bevelEnabled: false, depth: 0.1 }]} />
					<meshStandardMaterial color={hovered ? '#e6e6e6' : '#000000'} />
					<OrbitControls />
				</mesh>
			</group>
			<group position={[-3,0,-0.30]}>
				<Text
					color={hovered ? '#4c5059' : '#e6e6e6'}
					anchorX="right"
					anchorY="middle"
					font={'../styles/internal/fonts/MuseoSans/MuseoSans-Medium.ttf'}
					fontSize={0.5}
					maxWidth={15}
					textAlign="left"
				>
					Sandstone Item
				</Text>
			</group>

		</group>
	)
}

const Item3D = Skinnable(Item3DBase);

export default Item3D;
export {
	Item3DBase,
	Item3D
};