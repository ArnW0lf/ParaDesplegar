import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from tenants.models import Tenant
from tienda.models import Tienda, Categoria, Producto
from faker import Faker
from django.utils.text import slugify

User = get_user_model()

def get_unique_slug(tenant, nombre):
    """Genera un slug único para el tenant"""
    base_slug = slugify(nombre)
    slug = base_slug
    counter = 1
    
    # Verificar si ya existe un slug igual para este tenant
    while Tienda.objects.filter(tenant=tenant, slug=slug).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1
    return slug

class Command(BaseCommand):
    help = 'Crea tiendas y productos de ejemplo para cada tenant'

    def handle(self, *args, **options):
        fake = Faker('es_ES')
        
# Datos de productos por sector con descripciones variadas
        productos_por_sector = {
            'Tecnología': [
                ('Smartphone', 1500, [
                    'Experimenta la potencia en la palma de tu mano con nuestro smartphone insignia. Pantalla AMOLED de 6.7", cámara profesional y batería de larga duración.',
                    'Diseño elegante con procesador de última generación para un rendimiento excepcional en juegos y aplicaciones exigentes.',
                    'Captura momentos inolvidables con su sistema de triple cámara de 108MP y estabilización óptica de imagen.'
                ]),
                ('Laptop', 2500, [
                    'Potente portátil con procesador de 11ª generación, ideal para profesionales creativos y jugadores exigentes.',
                    'Diseño ultradelgado con pantalla táctil 4K y hasta 12 horas de duración de batería para máxima productividad.',
                    'Equipado con tarjeta gráfica dedicada, perfecta para diseño gráfico, edición de video y gaming de alto rendimiento.'
                ]),
                ('Tablet', 800, [
                    'Tableta versátil con lápiz óptico incluido, ideal para tomar notas, dibujar y disfrutar de contenido multimedia.',
                    'Pantalla de alta resolución con tecnología antirreflejos para una lectura cómoda incluso bajo luz solar directa.',
                    'Rendimiento potente en un diseño ultraligero, perfecta para trabajar y entretenerte en cualquier lugar.'
                ]),
                ('Auriculares inalámbricos', 150, [
                    'Sonido envolvente con cancelación activa de ruido para una experiencia auditiva inmersiva.',
                    'Hasta 30 horas de reproducción con una sola carga y carga rápida de 5 minutos para 2 horas de uso.',
                    'Diseño ergonómico con almohadillas suaves para un uso cómodo durante largas sesiones.'
                ]),
                ('Smartwatch', 300, [
                    'Monitoriza tu actividad física, frecuencia cardíaca y patrones de sueño con este reloj inteligente de última generación.',
                    'Resistente al agua y con GPS integrado, ideal para deportistas y personas activas.',
                    'Recibe notificaciones, controla tu música y realiza pagos sin sacar tu teléfono.'
                ]),
                ('Altavoz Bluetooth', 120, [
                    'Potente altavoz portátil con graves profundos y claridad de sonido excepcional.',
                    'Resistente al agua y al polvo, perfecto para llevar a la playa, piscina o camping.',
                    'Hasta 20 horas de reproducción continua y función de manos libres para llamadas.'
                ]),
                ('Disco duro externo', 100, [
                    'Almacena todos tus archivos importantes con este disco duro externo de alta capacidad y velocidad.',
                    'Diseño compacto y resistente a golpes, ideal para llevar contigo a todas partes.',
                    'Compatible con PC, Mac, consolas de videojuegos y televisores inteligentes.'
                ])
            ],
            'Moda': [
                ('Camiseta básica', 25, [
                    'Camiseta de algodón 100% orgánico, suave al tacto y transpirable para un uso cómodo todo el día.',
                    'Corte clásico y atemporal, disponible en una amplia gama de colores para combinar con cualquier look.',
                    'Diseño sin costuras laterales para mayor comodidad y durabilidad lavada tras lavada.'
                ]),
                ('Jeans ajustados', 50, [
                    'Pantalones de mezclilla elástica que se adaptan a tu figura con un ajuste ceñido y cómodo.',
                    'Diseño con cintura media y corte slim para un look moderno y juvenil.',
                    'Tela resistente con tratamiento antiarrugas para mantener su forma y color por más tiempo.'
                ]),
                ('Vestido de verano', 65, [
                    'Vestido ligero y fresco en tejido de lino natural, ideal para los días más calurosos.',
                    'Estampado floral con escote en V y espalda descubierta para un look veraniego y femenino.',
                    'Corte fluido que se adapta al cuerpo, perfecto para lucir en cualquier ocasión informal.'
                ]),
                ('Zapatillas deportivas', 80, [
                    'Calzado deportivo con tecnología de amortiguación para un mayor confort durante la actividad física.',
                    'Suela de goma con tracción multidireccional para una mejor adherencia en todo tipo de superficies.',
                    'Diseño transpirable con malla técnica que mantiene tus pies frescos y secos.'
                ])
            ],
            'Alimentación': [
                ('Arroz integral 1kg', 8, [
                    'Arroz integral de grano largo, rico en fibra y nutrientes esenciales para una alimentación saludable.',
                    'Cultivado de forma sostenible sin el uso de pesticidas ni productos químicos agresivos.',
                    'Tiempo de cocción aproximado de 35-40 minutos para obtener una textura esponjosa y sabrosa.'
                ]),
                ('Aceite de oliva virgen 1L', 15, [
                    'Aceite de oliva virgen extra de primera prensada en frío, con notas frutadas y ligeramente picantes.',
                    'Ideal para aderezar ensaladas, cocinar a bajas temperaturas o como acompañamiento de pan recién horneado.',
                    'Envase opaco que protege de la luz para mantener todas sus propiedades organolépticas.'
                ]),
                ('Miel pura 500g', 12, [
                    'Miel 100% natural sin pasteurizar, recolectada de colmenas ubicadas en zonas de montaña.',
                    'Endulzante natural rico en antioxidantes, vitaminas y minerales esenciales.',
                    'Ideal para endulzar infusiones, postres o simplemente disfrutar su sabor intenso a cucharadas.'
                ]),
                ('Chocolate negro 85% cacao', 6, [
                    'Tableta de chocolate negro con alto porcentaje de cacao, bajo contenido en azúcar y sin lácteos.',
                    'Ingredientes de comercio justo procedentes de pequeñas plantaciones sostenibles.',
                    'Perfecto para los amantes del chocolate intenso, con notas afrutadas y un final ligeramente amargo.'
                ])
            ],
            'Construcción': [
                ('Cemento 50kg', 35, [
                    'Cemento gris de alta resistencia para trabajos de construcción general, fraguado rápido y gran durabilidad.',
                    'Ideal para la preparación de morteros, hormigones y trabajos de albañilería en general.',
                    'Resistente a la humedad y a los cambios bruscos de temperatura una vez fraguado.'
                ]),
                ('Ladrillos x100', 120, [
                    'Ladrillos cerámicos de arcilla cocida, dimensiones estándar para muros de carga y tabiquería.',
                    'Excelente aislamiento térmico y acústico, con alta resistencia mecánica y durabilidad.',
                    'Superficie lisa y uniforme que facilita el revestimiento posterior.'
                ]),
                ('Pintura blanca 4L', 45, [
                    'Pintura plástica lavable de alto poder cubriente, ideal para interiores y zonas de alto tránsito.',
                    'Acabado mate que disimula imperfecciones, resistente a las manchas y fácilito de limpiar.',
                    'Bajo contenido en compuestos orgánicos volátiles (COV) para una aplicación más saludable.'
                ]),
                ('Taladro percutor 650W', 180, [
                    'Taladro percutor profesional con potencia de 650W y velocidad variable para múltiples aplicaciones.',
                    'Incluye función de percusión para trabajar sobre hormigón, ladrillo y piedra con facilidad.',
                    'Empuñadura ergonómica antideslizante y diseño compacto para mayor comodidad en trabajos prolongados.'
                ])
            ],
            'Consultoría': [
                ('Asesoría inicial 1h', 80, [
                    'Sesión personalizada de diagnóstico donde analizaremos tus necesidades y objetivos empresariales.',
                    'Evaluación preliminar de tu situación actual y propuesta de estrategias de mejora.',
                    'Orientación profesional para identificar oportunidades de crecimiento y optimización en tu negocio.'
                ]),
                ('Plan estratégico', 1500, [
                    'Desarrollo de un plan estratégico personalizado con objetivos claros y métricas de seguimiento.',
                    'Análisis DAFO (Debilidades, Amenazas, Fortalezas, Oportunidades) de tu empresa.',
                    'Hoja de ruta detallada con acciones concretas para alcanzar tus metas empresariales.'
                ]),
                ('Estudio de mercado', 2500, [
                    'Investigación exhaustiva del mercado objetivo, competencia y tendencias del sector.',
                    'Análisis de oportunidades de negocio y evaluación de la demanda potencial.',
                    'Informe detallado con conclusiones y recomendaciones estratégicas basadas en datos reales.'
                ]),
                ('Capacitación equipo', 1200, [
                    'Sesiones formativas personalizadas para mejorar las habilidades de tu equipo en áreas clave.',
                    'Metodología práctica con ejercicios y casos reales para asegurar la transferencia de conocimiento.',
                    'Material didáctico incluido y seguimiento posterior para garantizar la aplicación de lo aprendido.'
                ])
            ]
        }

        # Obtener todos los tenants
        tenants = Tenant.objects.all()
        
        for tenant in tenants:
            # Usar una transacción anidada para cada tenant
            with transaction.atomic():
                # Configurar el esquema del tenant
                from tenants.utils import set_schema
                set_schema(tenant.schema_name)
                
                # Obtener el usuario cliente de este tenant
                cliente = User.objects.filter(tenant=tenant, role='cliente').first()
                if not cliente:
                    self.stdout.write(self.style.WARNING(f'No se encontró cliente para el tenant {tenant.name}'))
                    continue
                    
                # Verificar que el usuario sea cliente (doble verificación)
                if cliente.role != 'cliente':
                    self.stdout.write(self.style.WARNING(f'El usuario {cliente.username} no tiene rol de cliente en el tenant {tenant.name}'))
                    continue
                
                # Verificar si ya existe una tienda para este cliente
                tienda = Tienda.objects.filter(usuario=cliente).first()
                if not tienda:
                    # Crear la tienda
                    # Generar un slug único para la tienda
                    slug = get_unique_slug(tenant, tenant.name)
                    
                    tienda = Tienda.objects.create(
                        tenant=tenant,
                        usuario=cliente,
                        nombre=f"{tenant.name}",
                        slug=slug,
                        descripcion=f"Bienvenido a {tenant.name}, su tienda de confianza en {tenant.name.split()[-1]}",
                        publicado=True,  # Asegurar que todas las tiendas estén publicadas
                        tema=random.choice(['default', 'modern', 'minimal', 'corporate']),
                        color_primario=f"#{random.randint(0, 0xFFFFFF):06x}",
                        color_secundario=f"#{random.randint(0, 0xFFFFFF):06x}",
                        color_texto='#333333',
                        color_fondo='#FFFFFF'
                    )
                    self.stdout.write(self.style.SUCCESS(f'Creada tienda: {tienda.nombre}'))
                else:
                    self.stdout.write(self.style.NOTICE(f'Tienda existente: {tienda.nombre}'))
                
                # Obtener el sector de la empresa
                sector = tenant.name.split()[-1] if ' ' in tenant.name else tenant.name
                if 'Tecno' in tenant.name:
                    sector_key = 'Tecnología'
                elif 'Moda' in tenant.name:
                    sector_key = 'Moda'
                elif 'Alimento' in tenant.name:
                    sector_key = 'Alimentación'
                elif 'Construc' in tenant.name:
                    sector_key = 'Construcción'
                else:
                    sector_key = 'Consultoría'
                
                # Crear categorías para la tienda
                categorias = []
                if sector_key == 'Tecnología':
                    categorias_nombres = ['Smartphones', 'Computación', 'Audio', 'Accesorios']
                elif sector_key == 'Moda':
                    categorias_nombres = ['Ropa Mujer', 'Ropa Hombre', 'Accesorios', 'Calzado']
                elif sector_key == 'Alimentación':
                    categorias_nombres = ['Orgánicos', 'Sin gluten', 'Veganos', 'Sin azúcar']
                elif sector_key == 'Construcción':
                    categorias_nombres = ['Materiales', 'Herramientas', 'Electricidad', 'Fontanería']
                else:  # Consultoría
                    categorias_nombres = ['Estrategia', 'Finanzas', 'Marketing', 'Recursos Humanos']
                
                for nombre_cat in categorias_nombres:
                    cat, created = Categoria.objects.get_or_create(
                        tienda=tienda,
                        nombre=nombre_cat,
                        defaults={'descripcion': f'Productos de la categoría {nombre_cat}'}
                    )
                    if created:
                        self.stdout.write(self.style.SUCCESS(f'  - Categoría creada: {nombre_cat}'))
                    categorias.append(cat)
                
                # Crear productos para la tienda (tomamos los 7 primeros productos del sector)
                productos = productos_por_sector.get(sector_key, [])[:7]  # Aseguramos 7 productos por tienda
                for producto_info in productos:
                    if len(producto_info) == 3:  # Si tiene nombre, precio y descripción
                        nombre, precio, descripciones = producto_info
                    else:  # Si solo tiene nombre y precio
                        nombre, precio = producto_info
                        descripciones = [f'Descripción para {nombre}']
                    
                    # Seleccionar una descripción aleatoria
                    descripcion = random.choice(descripciones) if isinstance(descripciones, list) else descripciones
                    
                    # Seleccionar una categoría aleatoria
                    categoria = random.choice(categorias)
                    
                    # Calcular stock según el tipo de producto
                    stock = self.get_stock_por_tipo(nombre)
                    
                    # Calcular precio con variación
                    precio_final = round(precio * (0.8 + random.random() * 0.4), 2)  # Variación del 80% al 120%
                    
                    # Crear el producto
                    producto, created = Producto.objects.get_or_create(
                        tienda=tienda,
                        nombre=nombre,
                        defaults={
                            'descripcion': descripcion,
                            'precio': precio_final,
                            'stock': stock,
                            'categoria': categoria,
                            'eliminado': False
                        }
                    )
                    
                    if created:
                        self.stdout.write(self.style.SUCCESS(f'  - Producto creado: {nombre} (${precio_final:.2f}) - Stock: {stock}'))
            
            self.stdout.write(self.style.SUCCESS(f'\nProceso completado para el tenant {tenant.name}.'))
    
    def get_stock_por_tipo(self, producto_nombre):
        """Devuelve un stock más realista según el tipo de producto"""
        producto_lower = producto_nombre.lower()
        
        # Tecnología
        if any(p in producto_lower for p in ['smartphone', 'laptop', 'tablet', 'smartwatch', 'monitor']):
            return random.randint(3, 15)  # Productos electrónicos caros
        elif any(p in producto_lower for p in ['auriculares', 'altavoz', 'teclado', 'mouse', 'webcam', 'impresora', 'disco duro']):
            return random.randint(5, 25)
            
        # Moda
        elif any(p in producto_lower for p in ['camiseta', 'jeans', 'vestido', 'chaqueta', 'zapatos', 'zapatillas']):
            return random.randint(10, 50)  # Ropa
        elif any(p in producto_lower for p in ['bolso', 'gafas', 'reloj', 'bufanda', 'cinturón', 'gorra', 'chaleco', 'pulsera']):
            return random.randint(5, 30)  # Accesorios
            
        # Alimentación
        elif any(p in producto_lower for p in ['arroz', 'harina', 'miel', 'mermelada', 'leche', 'granola', 'té', 'galletas', 'mantequilla', 'frutos secos', 'chocolate', 'muesli']):
            return random.randint(20, 200)  # Alimentos envasados
            
        # Construcción
        elif any(p in producto_lower for p in ['cemento', 'ladrillos', 'pintura', 'cerámica', 'tubería', 'cable', 'llave', 'destornillador', 'martillo', 'cinta', 'nivel', 'taladro', 'sierra', 'andamio']):
            return random.randint(15, 100)  # Materiales y herramientas
            
        # Servicios (consultoría)
        elif any(p in producto_lower for p in ['asesoría', 'plan', 'estudio', 'capacitación', 'auditoría', 'optimización', 'consultoría', 'taller', 'análisis']):
            return 1  # Servicios generalmente no tienen stock
            
        return random.randint(5, 50)  # Valor por defecto
    
