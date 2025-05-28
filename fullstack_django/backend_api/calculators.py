import math

def get_calculation_types():
    """Возвращает доступные типы расчетов с категориями"""
    return {
        'repair': {
            'name': 'Ремонт',
            'description': 'Расчет материалов для ремонтных работ',
            'calculations': {
                'paint': {
                    'name': 'Покраска стен',
                    'description': 'Расчет количества краски для стен',
                    'fields': [
                        {'name': 'length', 'label': 'Длина комнаты (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'width', 'label': 'Ширина комнаты (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'height', 'label': 'Высота стен (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'coats', 'label': 'Количество слоев', 'type': 'number', 'min': 1, 'default': 2},
                        {'name': 'consumption', 'label': 'Расход краски (кг/м²)', 'type': 'number', 'min': 0.01, 'step': 0.01, 'default': 0.15},
                    ]
                },
                'tiles': {
                    'name': 'Укладка плитки',
                    'description': 'Расчет количества напольной плитки',
                    'fields': [
                        {'name': 'length', 'label': 'Длина пола (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'width', 'label': 'Ширина пола (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'tile_width', 'label': 'Ширина плитки (м)', 'type': 'number', 'min': 0.01, 'step': 0.01},
                        {'name': 'tile_height', 'label': 'Длина плитки (м)', 'type': 'number', 'min': 0.01, 'step': 0.01},
                    ]
                },
                'wallpaper': {
                    'name': 'Обои',
                    'description': 'Расчет количества рулонов обоев',
                    'fields': [
                        {'name': 'length', 'label': 'Длина комнаты (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'width', 'label': 'Ширина комнаты (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'height', 'label': 'Высота стен (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'roll_width', 'label': 'Ширина рулона (м)', 'type': 'number', 'min': 0.1, 'step': 0.01},
                        {'name': 'roll_length', 'label': 'Длина рулона (м)', 'type': 'number', 'min': 1, 'step': 0.1},
                    ]
                },
                'laminate': {
                    'name': 'Ламинат',
                    'description': 'Расчет количества упаковок ламината',
                    'fields': [
                        {'name': 'length', 'label': 'Длина комнаты (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'width', 'label': 'Ширина комнаты (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'laminate_length', 'label': 'Длина доски (м)', 'type': 'number', 'min': 0.1, 'step': 0.01},
                        {'name': 'laminate_width', 'label': 'Ширина доски (м)', 'type': 'number', 'min': 0.01, 'step': 0.01},
                        {'name': 'pack_count', 'label': 'Досок в упаковке', 'type': 'number', 'min': 1},
                    ]
                },
                'plaster': {
                    'name': 'Штукатурка',
                    'description': 'Расчет количества штукатурки',
                    'fields': [
                        {'name': 'length', 'label': 'Длина комнаты (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'width', 'label': 'Ширина комнаты (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'height', 'label': 'Высота стен (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'thickness', 'label': 'Толщина слоя (м)', 'type': 'number', 'min': 0.001, 'step': 0.001},
                        {'name': 'density', 'label': 'Плотность (кг/м³)', 'type': 'number', 'min': 1, 'default': 1600},
                    ]
                }
            }
        },
        'construction': {
            'name': 'Строительство',
            'description': 'Расчет материалов для строительных работ',
            'calculations': {
                'foundation': {
                    'name': 'Фундамент',
                    'description': 'Расчет бетона для фундамента',
                    'fields': [
                        {'name': 'length', 'label': 'Длина фундамента (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'width', 'label': 'Ширина фундамента (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'depth', 'label': 'Глубина фундамента (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'concrete_per_cubic', 'label': 'Бетона на 1м³ (кг)', 'type': 'number', 'min': 1, 'default': 2400},
                    ]
                },
                'bricks': {
                    'name': 'Кирпичная кладка',
                    'description': 'Расчет количества кирпичей',
                    'fields': [
                        {'name': 'wall_length', 'label': 'Длина стены (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'wall_height', 'label': 'Высота стены (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'brick_length', 'label': 'Длина кирпича (м)', 'type': 'number', 'min': 0.01, 'step': 0.01, 'default': 0.25},
                        {'name': 'brick_height', 'label': 'Высота кирпича (м)', 'type': 'number', 'min': 0.01, 'step': 0.01, 'default': 0.065},
                        {'name': 'wall_thickness', 'label': 'Толщина стены (кирпичей)', 'type': 'number', 'min': 0.5, 'step': 0.5, 'default': 1},
                    ]
                },
                'roofing': {
                    'name': 'Кровельные материалы',
                    'description': 'Расчет материалов для крыши',
                    'fields': [
                        {'name': 'roof_length', 'label': 'Длина крыши (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'roof_width', 'label': 'Ширина крыши (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'sheet_length', 'label': 'Длина листа (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'sheet_width', 'label': 'Ширина листа (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'overlap', 'label': 'Нахлест (%)', 'type': 'number', 'min': 0, 'max': 50, 'default': 10},
                    ]
                },
                'insulation': {
                    'name': 'Утеплитель',
                    'description': 'Расчет утеплителя для стен',
                    'fields': [
                        {'name': 'wall_length', 'label': 'Длина стены (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'wall_height', 'label': 'Высота стены (м)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                        {'name': 'insulation_thickness', 'label': 'Толщина утеплителя (м)', 'type': 'number', 'min': 0.01, 'step': 0.01},
                        {'name': 'insulation_area_per_pack', 'label': 'Площадь в упаковке (м²)', 'type': 'number', 'min': 0.1, 'step': 0.1},
                    ]
                }
            }
        }
    }

def calculate_paint(params):
    """Расчет краски для стен"""
    wall_area = 2 * (params['length'] + params['width']) * params['height']
    paint_kg = wall_area * params['coats'] * params['consumption']
    return {
        'materials': [
            {'name': 'Краска', 'quantity': round(paint_kg, 2), 'unit': 'кг'}
        ],
        'total_area': round(wall_area, 2),
        'details': f'Площадь стен: {round(wall_area, 2)} м²'
    }

def calculate_tiles(params):
    """Расчет напольной плитки"""
    floor_area = params['length'] * params['width']
    tile_area = params['tile_width'] * params['tile_height']
    tiles_count = math.ceil((floor_area / tile_area) * 1.1)  # +10% запас
    
    return {
        'materials': [
            {'name': 'Плитка', 'quantity': tiles_count, 'unit': 'шт'}
        ],
        'total_area': round(floor_area, 2),
        "details": f"Площадь пола: {round(floor_area, 2)} м²\nРазмер плитки: {params['tile_width']}x{params['tile_height']} м"

    }

def calculate_wallpaper(params):
    """Расчет обоев"""
    perimeter = 2 * (params['length'] + params['width'])
    strips = perimeter / params['roll_width']
    rolls = math.ceil((strips * params['height']) / params['roll_length'] * 1.15)  # 15% запас
    
    return {
        'materials': [
            {'name': 'Обои', 'quantity': rolls, 'unit': 'рулонов'}
        ],
        'total_area': round(perimeter * params['height'], 2),
        "details": f"Периметр комнаты: {round(perimeter, 2)} м\nВысота стен: {params['height']} м"
    }

def calculate_laminate(params):
    """Расчет ламината"""
    room_area = params['length'] * params['width']
    laminate_area = params['laminate_length'] * params['laminate_width']
    packs = math.ceil((room_area / laminate_area) * 1.1 / params['pack_count'])  # 10% запас
    
    return {
        'materials': [
            {'name': 'Ламинат', 'quantity': packs, 'unit': 'упаковок'}
        ],
        'total_area': round(room_area, 2),
        'details': f"Площадь комнаты: {round(room_area, 2)} м²\nДосок в упаковке: {params['pack_count']}"
    }

def calculate_plaster(params):
    """Расчет штукатурки"""
    wall_area = 2 * (params['length'] + params['width']) * params['height']
    material_kg = wall_area * params['thickness'] * params['density']
    
    return {
        'materials': [
            {'name': 'Штукатурка', 'quantity': round(material_kg, 2), 'unit': 'кг'}
        ],
        'total_area': round(wall_area, 2),
        "details": f"Площадь стен: {round(wall_area, 2)} м²\nТолщина слоя: {params['thickness']} м"
    }

def calculate_foundation(params):
    """Расчет бетона для фундамента"""
    volume = params['length'] * params['width'] * params['depth']
    concrete_kg = volume * params['concrete_per_cubic']
    
    return {
        'materials': [
            {'name': 'Бетон', 'quantity': round(concrete_kg, 2), 'unit': 'кг'},
            {'name': 'Объем работ', 'quantity': round(volume, 2), 'unit': 'м³'}
        ],
        'details': f'Объем фундамента: {round(volume, 3)} м³'
    }

def calculate_bricks(params):
    """Расчет кирпичей для кладки"""
    brick_area = params['brick_length'] * params['brick_height']
    bricks_per_sq_m = 1 / brick_area
    bricks_count = math.ceil(
        params['wall_length'] * params['wall_height'] * 
        bricks_per_sq_m * params['wall_thickness'] * 1.1  # +10% запас
    )
    
    return {
        'materials': [
            {'name': 'Кирпичи', 'quantity': bricks_count, 'unit': 'шт'}
        ],
        "details": f"Размер кирпича: {params['brick_length']}x{params['brick_height']} м\nТолщина стены: {params['wall_thickness']} кирпича"
    }

def calculate_roofing(params):
    """Расчет кровельных материалов"""
    roof_area = params['roof_length'] * params['roof_width']
    sheet_area = params['sheet_length'] * params['sheet_width']
    sheets_count = math.ceil(
        (roof_area / sheet_area) * (1 + params['overlap'] / 100)
    )
    
    return {
        'materials': [
            {'name': 'Кровельные листы', 'quantity': sheets_count, 'unit': 'шт'}
        ],
        'total_area': round(roof_area, 2),
        "details": f"Площадь крыши: {round(roof_area, 2)} м²\nНахлест: {params['overlap']}%"
    }

def calculate_insulation(params):
    """Расчет утеплителя"""
    wall_area = params['wall_length'] * params['wall_height']
    packs = math.ceil(wall_area / params['insulation_area_per_pack'])
    
    return {
        'materials': [
            {'name': 'Утеплитель', 'quantity': packs, 'unit': 'упаковок'}
        ],
        'total_area': round(wall_area, 2),
        'details': f'Площадь утепления: {round(wall_area, 2)} м²'
    }