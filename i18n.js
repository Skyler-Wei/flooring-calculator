/**
 * 多语言系统
 */
const T = {
    zh: {
        // Header
        app_title: '地板装柜计算软件',
        language_label: '语言',
        language_en: '英文',
        language_zh: '中文',
        language_vi: '越南语',
        btn_calculate: '计 算',

        // Floor params
        card_floor: '单片地板参数',
        floor_length: '地板长 (mm)',
        floor_width: '地板宽 (mm)',
        floor_thickness: '本体厚度，不含底垫 (mm)',
        floor_density: '本体密度，不含底垫 (g/cm³)',
        pad_thickness: '底垫厚度 (mm)',
        total_thickness: '单片总厚度',
        piece_area: '单片面积',

        // Box params
        card_box: '包装（盒）参数',
        box_length: '盒子长 (mm)',
        box_width: '盒子宽 (mm)',
        pieces_per_box: '每盒片数',
        packing_allowance: '纸箱高度余量 (mm)',
        box_height: '纸箱高度 (mm，自动计算)',
        btn_reset_box: '重置为默认',
        box_auto_hint: '默认 = 地板尺寸 + 4 mm，可手动覆盖',

        // Pallet params
        card_pallet: '托盘参数',
        pallet_length: '托盘长 (mm)',
        pallet_width: '托盘宽 (mm)',
        pallet_height: '托盘高度 (mm)',
        pallet_self_weight: '托盘自重 (kg)',

        // Gap params
        card_gaps: '间隙参数',
        box_gap: '盒与盒间隙 (mm)',
        pallet_gap: '托盘间隙 (mm)',
        wall_gap: '货柜壁间隙 (mm)',

        // Limits
        card_limits: '限制条件',
        box_weight_limit: '一盒限重 (kg)',
        pallet_weight_limit: '托盘限重 (kg)',
        container_weight_limit: '货柜限重 (kg)',
        safe_height: '叠放安全高度 (mm)',
        container_size: '货柜内部可用尺寸',
        container_type: '货柜柜型',
        container_hint: '请直接增减内部尺寸来预留装卸空间。',
        weight_hint: '底垫，纸箱等辅材重量预设为500kg只计入整柜货载，不分摊至单托限重。',
        auxiliary_weight: '整柜预估辅材重量 (kg)',
        auxiliary_weight_result: '预估辅材重量',
        cargo_weight: '地板＋全部空托盘',
        upper_pallets: '其中上层托盘数',
        card_layout: '托盘摆放方式',
        box_layout: '纸箱摆放方式',
        box_mode_H: '统一朝向：纸箱长沿托盘长',
        box_mode_V: '统一朝向：纸箱长沿托盘宽',
        box_mode_mixed: '允许同层横竖混排',
        invalid_box_layout: '请选择有效的纸箱摆放方式。',
        layout_mode: '按客户叉车条件选择',
        mode_auto: '自动比较全部摆法',
        mode_H: '全部同向：托盘长沿柜长',
        mode_V: '全部同向：托盘长沿柜宽',
        mode_mixed: '允许横竖混排／错位',
        layout_hint: '每托盒数、层数和层内摆法一致，只装整层。最多叠两托，上托与下托对齐并完整支撑。',
        floor_layout_count: '横向 {horizontal} 托＋竖向 {vertical} 托',
        box_layer_count: '{count} 盒／整层',
        constraints_pass: '✅ 所有约束均满足，整柜已计入预估辅材重量。',
        recalculate: '参数已修改，请点击“计算”更新装柜方案。',
        invalid_number: '请检查“{field}”：必须填写有效数值；尺寸、密度、片数及限重须大于零，其余不能为负。',
        invalid_pieces: '每盒片数必须是正整数。',
        invalid_layout: '请选择有效的托盘摆放方式。',
        numeric_range: '数值超出可计算范围，请检查尺寸、厚度和密度。',
        simplified_preview: '单托盒数超过 5000，3D 以完整货物块展示；装载数值不变。',
        box_too_small: '纸箱长宽不能小于地板长宽，请检查手动覆盖的尺寸。',
        calculation_too_large: '尺寸比例超出交互计算范围（单层最多支持 2000 个候选位置），请检查单位是否为 mm。',
        box_overweight: '单盒超重，当前方案不可行。按单盒限重最多可装 {max} 片；程序不会自动修改片数。',
        box_does_not_fit: '所选纸箱摆法下无法放入托盘，请检查摆法、纸箱和托盘尺寸。',
        pallet_does_not_fit: '所选摆法下托盘无法放入货柜，请调整摆法或可用尺寸。',
        auxiliary_overweight: '辅材重量已用尽或超过整柜货载额度，无法装载地板。',
        no_solution: '无可行装柜方案：当前尺寸、限重和辅材预留不足以装入至少一托完整层货物。',
        suggestions_title: '装载建议',
        search_scope: '当前方案保持输入片数不变，比较统一层数、托盘数量和一／两层叠托，以已搜索摆法中的总 SQM 最大为目标。面积相同时优先少用托盘。',
        packing_search_note: '已比较同向、横竖分区与错位摆法；复杂二维排布未证明全局最优。',
        suggest_layout: '若客户叉车允许横竖混排，保持当前每盒片数，可装至 {area} m²。请自行切换摆法后计算。',
        suggest_pieces: '在当前允许的摆法下，建议评估 {pieces} 片／盒、每托 {layers} 层、共 {pallets} 托，可装 {area} m²。仅供比较，未更改输入。',
        suggest_search_limit: '片数建议已比较 1–{max} 片／盒，未搜索更大的片数。',
        viewer_unavailable: '3D 预览暂不可用，请检查网络及浏览器 WebGL 支持；数值计算仍可使用。',
        container_l: '长 (mm)',
        container_w: '宽 (mm)',
        container_h: '高 (mm)',

        // Results - Box
        result_box: '📦 单盒信息',
        r_piece_weight: '单片重量',
        r_box_weight: '单盒重量',
        r_box_area: '单盒面积',
        r_box_size: '单盒尺寸',
        r_box_limit_check: '限重校验',
        r_pass: '✅ 通过',
        r_over: '❌ 超限',

        // Results - Pallet
        result_pallet: '🔲 单托盘信息',
        r_layer_layout: '排列方式',
        r_layer_layout_desc_A: '横放 {cols}列 × {rows}行 = {count}盒/层',
        r_layer_layout_desc_B: '竖放 {cols}列 × {rows}行 = {count}盒/层',
        r_layer_layout_desc_C: '混放 横{aCols}×{aRows} + 竖{bCols}×{bRows} = {count}盒/层',
        r_layers: '层数',
        r_pallet_total_boxes: '总盒数',
        r_pallet_total_pieces: '总片数',
        r_pallet_total_area: '总面积',
        r_cargo_height: '货物高度',
        r_pallet_total_height: '含底座总高',
        r_pallet_total_weight: '总重量',

        // Results - Container
        result_container: '🚛 货柜信息',
        r_floor_layout: '底面排列',
        r_vertical_layers: '垂直叠放层数',
        r_total_pallets: '可装托盘总数',
        r_container_total_boxes: '总盒数',
        r_container_total_pieces: '总片数',
        r_container_total_area: '总面积',
        r_container_total_weight: '总重量',
        r_space_util: '托盘包络体积占比',
        r_weight_util: '重量利用率',

        // Floor layout descriptions
        layout_pure_h: '纯横放 {h}×{hr} = {n}托盘/层',
        layout_pure_v: '纯竖放 {v}×{vr} = {n}托盘/层',
        layout_mix: '横放 {h}×{hr} + 竖放 {v}×{vr} = {n}托盘/层',

        // Warnings
        warn_box_overweight: '⚠️ 单盒重量 {current}kg 超过限制 {limit}kg，建议每盒片数减少至 {suggest} 片',
        warn_pallet_overweight: '⚠️ 托盘总重 {current}kg 超过限制 {limit}kg，已自动减少层数',
        warn_container_overweight: '⚠️ 货柜总重 {current}kg 超过限制 {limit}kg，已自动减少托盘数',
        warn_pallet_too_tall: '❌ 托盘含底座总高 {current}mm 超过货柜高度 {limit}mm，无法装柜',

        // 3D
        view_pallet: '托盘 3D 视图',
        view_container: '货柜 3D 视图',
        btn_reset_view: '重置视角',

        // Units
        unit_kg: 'kg',
        unit_mm: 'mm',
        unit_m2: 'm²',
        unit_pct: '%',
        r_layers_unit: '层',
        r_pieces_unit: '片',
        r_boxes_unit: '盒',
        r_pallets_unit: '个',

        // Limit reason
        limit_by_height: '(受高度限制)',
        limit_by_weight: '(受重量限制)',
    },
    en: {
        app_title: 'Flooring Container Loading Calculator',
        language_label: 'Language',
        language_en: 'English',
        language_zh: 'Chinese',
        language_vi: 'Vietnamese',
        btn_calculate: 'Calculate',

        card_floor: 'Floor Tile Parameters',
        floor_length: 'Tile Length (mm)',
        floor_width: 'Tile Width (mm)',
        floor_thickness: 'Core Thickness, No Underlay (mm)',
        floor_density: 'Core Density, No Underlay (g/cm³)',
        pad_thickness: 'Underlay Thickness (mm)',
        total_thickness: 'Total Tile Thickness',
        piece_area: 'Piece Area',

        card_box: 'Packaging (Box) Parameters',
        box_length: 'Box Length (mm)',
        box_width: 'Box Width (mm)',
        pieces_per_box: 'Pieces Per Box',
        packing_allowance: 'Box Height Allowance (mm)',
        box_height: 'Box Height (mm, calculated)',
        btn_reset_box: 'Reset to Default',
        box_auto_hint: 'Default = tile size + 4 mm; editable',

        card_pallet: 'Pallet Parameters',
        pallet_length: 'Pallet Length (mm)',
        pallet_width: 'Pallet Width (mm)',
        pallet_height: 'Pallet Height (mm)',
        pallet_self_weight: 'Pallet Weight (kg)',

        card_gaps: 'Gap Parameters',
        box_gap: 'Box-to-Box Gap (mm)',
        pallet_gap: 'Pallet-to-Pallet Gap (mm)',
        wall_gap: 'Wall Gap (mm)',

        card_limits: 'Constraints',
        box_weight_limit: 'Box Weight Limit (kg)',
        pallet_weight_limit: 'Pallet Weight Limit (kg)',
        container_weight_limit: 'Container Weight Limit (kg)',
        safe_height: 'Safe Stacking Height (mm)',
        container_size: 'Usable Container Interior',
        container_type: 'Container Type',
        container_hint: 'Adjust the interior dimensions directly to reserve loading and unloading clearance.',
        weight_hint: 'Underlay, cartons and other auxiliary materials have a preset total weight of 500 kg. This counts toward container payload only, not individual pallet limits.',
        auxiliary_weight: 'Estimated Auxiliary Weight (kg)',
        auxiliary_weight_result: 'Estimated Auxiliary Weight',
        cargo_weight: 'Flooring + All Empty Pallets',
        upper_pallets: 'Pallets on Upper Level',
        card_layout: 'Pallet Arrangement',
        box_layout: 'Box Arrangement',
        box_mode_H: 'Box Length Along Pallet Length',
        box_mode_V: 'Box Length Along Pallet Width',
        box_mode_mixed: 'Allow Mixed Orientations Within a Layer',
        invalid_box_layout: 'Choose a valid box arrangement.',
        layout_mode: 'Choose for Customer Forklift Access',
        mode_auto: 'Compare All Arrangements',
        mode_H: 'Pallet Length Along Container Length',
        mode_V: 'Pallet Length Along Container Width',
        mode_mixed: 'Allow Mixed / Staggered',
        layout_hint: 'Identical box counts, full layers and layer layouts on every pallet. At most two pallets high, aligned and fully supported.',
        floor_layout_count: '{horizontal} lengthwise + {vertical} widthwise',
        box_layer_count: '{count} boxes / full layer',
        constraints_pass: '✅ All constraints satisfied. Estimated auxiliary weight is included.',
        recalculate: 'Inputs changed. Click Calculate to update the loading plan.',
        invalid_number: 'Check {field}: enter a finite number. Dimensions, density, pieces and limits must be positive; other values cannot be negative.',
        invalid_pieces: 'Pieces per box must be a positive integer.',
        invalid_layout: 'Choose a valid pallet arrangement.',
        numeric_range: 'Values exceed the numerical calculation range. Check dimensions, thickness and density.',
        simplified_preview: 'Above 5000 boxes per pallet, 3D shows a single cargo block. Calculated quantities are unchanged.',
        box_too_small: 'Box length and width cannot be smaller than the tile. Check manual overrides.',
        calculation_too_large: 'Dimension ratios exceed the interactive calculation range (2000 candidate positions per layer). Check that units are mm.',
        box_overweight: 'Box exceeds its weight limit; this plan is infeasible. The box weight limit permits at most {max} pieces. Inputs are not changed automatically.',
        box_does_not_fit: 'The box cannot fit on the pallet in the selected orientation. Check arrangement, box and pallet dimensions.',
        pallet_does_not_fit: 'The pallet cannot fit using the selected arrangement. Check arrangement or usable dimensions.',
        auxiliary_overweight: 'Auxiliary weight uses all or exceeds the container payload. No flooring can be loaded.',
        no_solution: 'No feasible plan: dimensions, weight limits and auxiliary reserve cannot accommodate even one pallet with a full layer.',
        suggestions_title: 'Loading Suggestions',
        search_scope: 'Keeps entered pieces per box and compares uniform layer counts, pallet counts and one/two levels to maximize SQM among searched layouts. Ties favor fewer pallets.',
        packing_search_note: 'Compared uniform, mixed strips and staggered layouts. Global optimality is not proven for complex 2D arrangements.',
        suggest_layout: 'If forklift access permits mixed orientations, the current pieces per box can load {area} m². Select an arrangement and recalculate to review.',
        suggest_pieces: 'With the currently allowed arrangement, consider {pieces} pieces/box, {layers} layers/pallet and {pallets} pallets for {area} m². Comparison only; inputs are unchanged.',
        suggest_search_limit: 'Piece-count suggestions compare 1–{max} pieces/box; larger counts were not searched.',
        viewer_unavailable: '3D preview is unavailable. Check network and WebGL support. Numerical calculation remains available.',
        container_l: 'Length (mm)',
        container_w: 'Width (mm)',
        container_h: 'Height (mm)',

        result_box: '📦 Box Info',
        r_piece_weight: 'Piece Weight',
        r_box_weight: 'Box Weight',
        r_box_area: 'Box Area',
        r_box_size: 'Box Dimensions',
        r_box_limit_check: 'Weight Check',
        r_pass: '✅ Pass',
        r_over: '❌ Over Limit',

        result_pallet: '🔲 Pallet Info',
        r_layer_layout: 'Layout',
        r_layer_layout_desc_A: 'Lengthwise {cols}col × {rows}row = {count} boxes/layer',
        r_layer_layout_desc_B: 'Widthwise {cols}col × {rows}row = {count} boxes/layer',
        r_layer_layout_desc_C: 'Mixed L{aCols}×{aRows} + W{bCols}×{bRows} = {count} boxes/layer',
        r_layers: 'Layers',
        r_pallet_total_boxes: 'Total Boxes',
        r_pallet_total_pieces: 'Total Pieces',
        r_pallet_total_area: 'Total Area',
        r_cargo_height: 'Cargo Height',
        r_pallet_total_height: 'Total Height (w/ base)',
        r_pallet_total_weight: 'Total Weight',

        result_container: '🚛 Container Info',
        r_floor_layout: 'Floor Layout',
        r_vertical_layers: 'Vertical Stack Layers',
        r_total_pallets: 'Total Pallets',
        r_container_total_boxes: 'Total Boxes',
        r_container_total_pieces: 'Total Pieces',
        r_container_total_area: 'Total Area',
        r_container_total_weight: 'Total Weight',
        r_space_util: 'Pallet Envelope Volume',
        r_weight_util: 'Weight Utilization',

        layout_pure_h: 'Lengthwise {h}×{hr} = {n} pallets/layer',
        layout_pure_v: 'Widthwise {v}×{vr} = {n} pallets/layer',
        layout_mix: 'Lengthwise {h}×{hr} + Widthwise {v}×{vr} = {n} pallets/layer',

        warn_box_overweight: '⚠️ Box weight {current}kg exceeds limit {limit}kg. Suggest reducing to {suggest} pieces/box.',
        warn_pallet_overweight: '⚠️ Pallet weight {current}kg exceeds limit {limit}kg. Layers reduced automatically.',
        warn_container_overweight: '⚠️ Container weight {current}kg exceeds limit {limit}kg. Pallets reduced automatically.',
        warn_pallet_too_tall: '❌ Pallet total height {current}mm exceeds container height {limit}mm. Cannot load.',

        view_pallet: 'Pallet 3D View',
        view_container: 'Container 3D View',
        btn_reset_view: 'Reset View',

        unit_kg: 'kg',
        unit_mm: 'mm',
        unit_m2: 'm²',
        unit_pct: '%',
        r_layers_unit: 'layers',
        r_pieces_unit: 'pcs',
        r_boxes_unit: 'boxes',
        r_pallets_unit: 'pallets',

        limit_by_height: '(height limited)',
        limit_by_weight: '(weight limited)',
    },
    vi: {
        app_title: 'Công cụ tính xếp sàn vào container',
        language_label: 'Ngôn ngữ',
        language_en: 'Tiếng Anh',
        language_zh: 'Tiếng Trung',
        language_vi: 'Tiếng Việt',
        btn_calculate: 'Tính toán',
        card_floor: 'Thông số tấm sàn',
        floor_length: 'Chiều dài tấm sàn (mm)',
        floor_width: 'Chiều rộng tấm sàn (mm)',
        floor_thickness: 'Độ dày lõi, không gồm lớp đệm (mm)',
        floor_density: 'Khối lượng riêng của lõi, không gồm lớp đệm (g/cm³)',
        pad_thickness: 'Độ dày lớp đệm (mm)',
        total_thickness: 'Tổng độ dày tấm sàn',
        piece_area: 'Diện tích mỗi tấm',
        card_box: 'Thông số hộp đóng gói',
        box_length: 'Chiều dài hộp (mm)',
        box_width: 'Chiều rộng hộp (mm)',
        pieces_per_box: 'Số tấm mỗi hộp',
        packing_allowance: 'Phần chiều cao tăng thêm do bao bì (mm)',
        box_height: 'Chiều cao hộp (mm, tự tính)',
        btn_reset_box: 'Khôi phục mặc định',
        box_auto_hint: 'Mặc định = kích thước tấm sàn + 4 mm; có thể sửa',
        card_pallet: 'Thông số pallet',
        pallet_length: 'Chiều dài pallet (mm)',
        pallet_width: 'Chiều rộng pallet (mm)',
        pallet_height: 'Chiều cao pallet rỗng (mm)',
        pallet_self_weight: 'Khối lượng pallet rỗng (kg)',
        card_gaps: 'Thông số khoảng hở',
        box_gap: 'Khoảng hở giữa các hộp (mm)',
        pallet_gap: 'Khoảng hở giữa các pallet (mm)',
        wall_gap: 'Khoảng hở với vách container (mm)',
        card_limits: 'Điều kiện giới hạn',
        box_weight_limit: 'Giới hạn khối lượng mỗi hộp (kg)',
        pallet_weight_limit: 'Giới hạn khối lượng mỗi pallet (kg)',
        container_weight_limit: 'Tải trọng cho phép của container (kg)',
        safe_height: 'Chiều cao xếp an toàn (mm)',
        container_size: 'Kích thước bên trong có thể sử dụng',
        container_type: 'Loại container',
        container_hint: 'Điều chỉnh tăng hoặc giảm trực tiếp kích thước bên trong để chừa khoảng trống bốc dỡ.',
        weight_hint: 'Lớp đệm, thùng carton và các vật tư phụ khác có tổng khối lượng mặc định là 500 kg, chỉ tính vào tải trọng container, không phân bổ vào giới hạn từng pallet.',
        auxiliary_weight: 'Khối lượng vật tư phụ ước tính (kg)',
        auxiliary_weight_result: 'Khối lượng vật tư phụ ước tính',
        cargo_weight: 'Sàn + toàn bộ pallet rỗng',
        upper_pallets: 'Số pallet ở tầng trên',
        card_layout: 'Cách bố trí pallet',
        box_layout: 'Cách bố trí hộp',
        box_mode_H: 'Chiều dài hộp dọc theo chiều dài pallet',
        box_mode_V: 'Chiều dài hộp dọc theo chiều rộng pallet',
        box_mode_mixed: 'Cho phép phối hợp các hướng trong cùng lớp',
        invalid_box_layout: 'Vui lòng chọn cách bố trí hộp hợp lệ.',
        layout_mode: 'Chọn theo khả năng tiếp cận của xe nâng',
        mode_auto: 'So sánh tất cả cách bố trí',
        mode_H: 'Chiều dài pallet dọc theo chiều dài container',
        mode_V: 'Chiều dài pallet dọc theo chiều rộng container',
        mode_mixed: 'Cho phép xếp phối hợp / so le',
        layout_hint: 'Mọi pallet có cùng số hộp, số lớp đầy đủ và cách xếp mỗi lớp. Chồng tối đa hai pallet, thẳng hàng và được đỡ hoàn toàn.',
        floor_layout_count: '{horizontal} pallet dọc + {vertical} pallet ngang',
        box_layer_count: '{count} hộp / lớp đầy đủ',
        constraints_pass: '✅ Đáp ứng tất cả điều kiện. Đã tính khối lượng vật tư phụ ước tính.',
        recalculate: 'Thông số đã thay đổi. Nhấn “Tính toán” để cập nhật phương án xếp hàng.',
        invalid_number: 'Kiểm tra “{field}”: cần nhập số hữu hạn. Kích thước, khối lượng riêng, số tấm và giới hạn phải lớn hơn 0; các giá trị khác không được âm.',
        invalid_pieces: 'Số tấm mỗi hộp phải là số nguyên dương.',
        invalid_layout: 'Vui lòng chọn cách bố trí pallet hợp lệ.',
        numeric_range: 'Giá trị vượt phạm vi tính toán. Kiểm tra kích thước, độ dày và khối lượng riêng.',
        simplified_preview: 'Khi mỗi pallet có hơn 5000 hộp, hình 3D hiển thị hàng dưới dạng một khối. Số lượng tính toán không thay đổi.',
        box_too_small: 'Chiều dài và chiều rộng hộp không được nhỏ hơn tấm sàn. Kiểm tra kích thước đã sửa thủ công.',
        calculation_too_large: 'Tỷ lệ kích thước vượt phạm vi tính toán tương tác (tối đa 2000 vị trí ứng viên mỗi lớp). Kiểm tra đơn vị có phải mm không.',
        box_overweight: 'Hộp vượt giới hạn khối lượng; phương án hiện tại không khả thi. Theo giới hạn mỗi hộp, có thể đóng tối đa {max} tấm. Số tấm không được tự động thay đổi.',
        box_does_not_fit: 'Hộp không vừa pallet theo hướng đã chọn. Kiểm tra cách bố trí, kích thước hộp và pallet.',
        pallet_does_not_fit: 'Pallet không vừa container theo cách bố trí đã chọn. Điều chỉnh cách bố trí hoặc kích thước có thể sử dụng.',
        auxiliary_overweight: 'Khối lượng vật tư phụ đã dùng hết hoặc vượt tải trọng container. Không thể xếp thêm sàn.',
        no_solution: 'Không có phương án khả thi: kích thước, giới hạn khối lượng và phần dành cho vật tư phụ không đủ cho một pallet có ít nhất một lớp đầy đủ.',
        suggestions_title: 'Gợi ý xếp hàng',
        search_scope: 'Giữ nguyên số tấm mỗi hộp đã nhập; so sánh số lớp đồng nhất, số pallet và xếp một hoặc hai tầng để tối đa hóa diện tích sàn trong các cách bố trí đã tìm. Nếu diện tích bằng nhau, ưu tiên ít pallet hơn.',
        packing_search_note: 'Đã so sánh xếp cùng hướng, phối hợp theo dải và so le. Chưa chứng minh được tối ưu toàn cục cho bố trí hai chiều phức tạp.',
        suggest_layout: 'Nếu xe nâng cho phép phối hợp các hướng, giữ nguyên số tấm mỗi hộp có thể xếp {area} m². Hãy chọn cách bố trí và tính lại để xem.',
        suggest_pieces: 'Với cách bố trí hiện được phép, cân nhắc {pieces} tấm/hộp, {layers} lớp/pallet và {pallets} pallet để xếp {area} m². Chỉ để so sánh; dữ liệu nhập chưa thay đổi.',
        suggest_search_limit: 'Gợi ý số tấm đã so sánh từ 1 đến {max} tấm/hộp; chưa tìm số lượng lớn hơn.',
        viewer_unavailable: 'Không thể hiển thị bản xem trước 3D. Kiểm tra kết nối mạng và hỗ trợ WebGL của trình duyệt. Vẫn có thể tính toán số liệu.',
        container_l: 'Dài (mm)',
        container_w: 'Rộng (mm)',
        container_h: 'Cao (mm)',
        result_box: '📦 Thông tin hộp',
        r_piece_weight: 'Khối lượng mỗi tấm',
        r_box_weight: 'Khối lượng mỗi hộp',
        r_box_area: 'Diện tích mỗi hộp',
        r_box_size: 'Kích thước hộp',
        r_box_limit_check: 'Kiểm tra khối lượng',
        r_pass: '✅ Đạt',
        r_over: '❌ Vượt giới hạn',
        result_pallet: '🔲 Thông tin pallet',
        r_layer_layout: 'Bố trí mỗi lớp',
        r_layer_layout_desc_A: 'Xếp dọc {cols} cột × {rows} hàng = {count} hộp/lớp',
        r_layer_layout_desc_B: 'Xếp ngang {cols} cột × {rows} hàng = {count} hộp/lớp',
        r_layer_layout_desc_C: 'Phối hợp: dọc {aCols}×{aRows} + ngang {bCols}×{bRows} = {count} hộp/lớp',
        r_layers: 'Số lớp',
        r_pallet_total_boxes: 'Tổng số hộp',
        r_pallet_total_pieces: 'Tổng số tấm',
        r_pallet_total_area: 'Tổng diện tích',
        r_cargo_height: 'Chiều cao hàng',
        r_pallet_total_height: 'Tổng chiều cao kể cả đế',
        r_pallet_total_weight: 'Tổng khối lượng',
        result_container: '🚛 Thông tin container',
        r_floor_layout: 'Bố trí trên sàn container',
        r_vertical_layers: 'Số tầng pallet',
        r_total_pallets: 'Tổng số pallet',
        r_container_total_boxes: 'Tổng số hộp',
        r_container_total_pieces: 'Tổng số tấm',
        r_container_total_area: 'Tổng diện tích',
        r_container_total_weight: 'Tổng khối lượng',
        r_space_util: 'Tỷ lệ thể tích bao pallet',
        r_weight_util: 'Tỷ lệ sử dụng tải trọng',
        layout_pure_h: 'Xếp dọc {h}×{hr} = {n} pallet/tầng',
        layout_pure_v: 'Xếp ngang {v}×{vr} = {n} pallet/tầng',
        layout_mix: 'Dọc {h}×{hr} + ngang {v}×{vr} = {n} pallet/tầng',
        warn_box_overweight: '⚠️ Khối lượng hộp {current} kg vượt giới hạn {limit} kg. Đề xuất giảm còn {suggest} tấm/hộp.',
        warn_pallet_overweight: '⚠️ Khối lượng pallet {current} kg vượt giới hạn {limit} kg. Đã tự động giảm số lớp.',
        warn_container_overweight: '⚠️ Khối lượng container {current} kg vượt giới hạn {limit} kg. Đã tự động giảm số pallet.',
        warn_pallet_too_tall: '❌ Tổng chiều cao pallet {current} mm vượt chiều cao container {limit} mm. Không thể xếp hàng.',
        view_pallet: 'Mô hình 3D pallet',
        view_container: 'Mô hình 3D container',
        btn_reset_view: 'Đặt lại góc nhìn',
        unit_kg: 'kg',
        unit_mm: 'mm',
        unit_m2: 'm²',
        unit_pct: '%',
        r_layers_unit: 'lớp',
        r_pieces_unit: 'tấm',
        r_boxes_unit: 'hộp',
        r_pallets_unit: 'pallet',
        limit_by_height: '(giới hạn bởi chiều cao)',
        limit_by_weight: '(giới hạn bởi khối lượng)',
    },
};

const LANGUAGE_LOCALES = { en: 'en-US', zh: 'zh-CN', vi: 'vi-VN' };
let currentLang = 'en';

function savedLanguage() {
    try {
        const language = localStorage.getItem('flooring-calculator-language');
        if (Object.hasOwn(T, language)) return language;
    } catch {}
    const preferredLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const locale of preferredLanguages) {
        const language = String(locale || '').toLowerCase().split(/[-_]/)[0];
        if (Object.hasOwn(T, language)) return language;
    }
    return 'en';
}

function t(key, params) {
    let s = T[currentLang][key] || T['en'][key] || key;
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            const formatted = typeof value === 'number'
                ? value.toLocaleString(LANGUAGE_LOCALES[currentLang], { maximumFractionDigits: 4 }) : value;
            s = s.replaceAll('{' + key + '}', () => formatted);
        }
    }
    return s;
}

function setLanguage(lang, remember = true) {
    currentLang = Object.hasOwn(T, lang) ? lang : 'en';
    document.documentElement.lang = currentLang;
    document.title = t('app_title');
    document.getElementById('language_select').value = currentLang;
    if (remember) {
        try {
            localStorage.setItem('flooring-calculator-language', currentLang);
        } catch {}
    }
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (el.tagName === 'INPUT' && el.type !== 'button' && el.type !== 'submit') {
            el.placeholder = t(key);
        } else {
            el.textContent = t(key);
        }
    });
    for (const attribute of ['title', 'aria-label']) {
        document.querySelectorAll('[data-i18n-' + attribute + ']').forEach(element => {
            element.setAttribute(attribute, t(element.getAttribute('data-i18n-' + attribute)));
        });
    }
    if (typeof updateFloorMetrics === 'function') updateFloorMetrics();
    if (typeof renderResults === 'function' && window._lastResult) {
        renderResults(window._lastResult);
        if (window._lastResult.valid && viewersAvailable) {
            renderPallet3D(window._lastResult);
            renderContainer3D(window._lastResult);
        }
    }
}
