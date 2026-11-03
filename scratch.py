import sys
with open('src/components/layout/Navigation.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

reports_start = content.find('      {\n        icon: FileBarChart2,\n        label: "Reports",')
print('reports_start:', reports_start)
if reports_start == -1:
    sys.exit(1)

sales_end = content.find('    ]\n  },', reports_start)
print('sales_end:', sales_end)

reports_and_analytics = content[reports_start:sales_end].strip()

new_content = content[:reports_start] + content[sales_end:]

activities_start = new_content.find('  {\n    title: \'Activities\',')
print('activities_start:', activities_start)

new_group = '''  {
    title: 'Reports & Analytics',
    items: [
      ''' + reports_and_analytics + '''
    ]
  },
'''

final_content = new_content[:activities_start] + new_group + new_content[activities_start:]

with open('src/components/layout/Navigation.tsx', 'w', encoding='utf-8') as f:
    f.write(final_content)
print('Done!')
