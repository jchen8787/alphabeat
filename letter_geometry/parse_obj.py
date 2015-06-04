#!/usr/bin/env python
import argparse
import re
import string
import os

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("-i","--input_folder", help="location of directory with obj files for each letter or singe .obj file",required=True)
    parser.add_argument("-o","--output_file", help="location to save file. stdout if ommitted")
    parser.add_argument("-f", "--file_not_dir",  help="single input file to parse instead of directory",action='store_true')
    args=parser.parse_args()

    if(args.file_not_dir==True):
        #parse the .obj file for vertex and normal data
        vertex_list = []
        normal_list = []
        vertex_index_list = []
        normal_index_list = []

        with open(args.input_folder, 'r') as f:
            for line in f:
                if line[0]=='v' and line[1]!='n': #vertex
                    tuple_elem=line.split()
                    vertex_list.append((tuple_elem[1],tuple_elem[2],tuple_elem[3]))
                elif line[0]=='v': #vertex normal
                    tuple_elem=line.split()
                    normal_list.append((tuple_elem[1],tuple_elem[2],str(-float(tuple_elem[3]))))
                elif line[0]=='f': #face
                    vertex_index_elem=re.findall(r"[\w']+", line)
                    vertex_index_list.append(vertex_index_elem[1])
                    vertex_index_list.append(vertex_index_elem[3])
                    vertex_index_list.append(vertex_index_elem[5])
                    normal_index_list.append(vertex_index_elem[2])
                    normal_index_list.append(vertex_index_elem[4])
                    normal_index_list.append(vertex_index_elem[6])

        #print the geometry formatted as an array of arrays in javascript
        vertex_array_string="var geometry_verticies= [\n"
        normal_array_string="var geometry_normals= [\n"


        vertex_array_string+="[\n"

        for vertex_index in vertex_index_list:
            vertex = vertex_list[int(vertex_index)-1]
            vertex_array_string+="\tvec3("+vertex[0]+", "+vertex[1]+", "+vertex[2]+"),\n"
        vertex_array_string = vertex_array_string[:-2]
        vertex_array_string+="\n],"

        normal_array_string+="[\n"
        for normal_index in normal_index_list:
            normal = normal_list[int(normal_index)-1]
            normal_array_string+="\tvec3("+normal[0]+", "+normal[1]+", "+normal[2]+"),\n"
        normal_array_string = normal_array_string[:-2]
        normal_array_string+="\n],"
        vertex_array_string = vertex_array_string[:-2]
        normal_array_string = normal_array_string[:-2]
        vertex_array_string+="]\n]\n"
        normal_array_string+="]\n]\n"
        
        if(args.output_file == None):
            print vertex_array_string
            print normal_array_string
        else:
            output_string=vertex_array_string+'\n'+normal_array_string
            with open(args.output_file, 'w') as f:
                f.write(output_string)
        return

    letter_to_geometry = {}

    for letter in list(string.ascii_lowercase)+list(range(10)):
        #parse the .obj file for vertex and normal data
        vertex_list = []
        normal_list = []
        vertex_index_list = []
        normal_index_list = []

        with open(os.path.join(args.input_folder,str(letter)+".obj"), 'r') as f:
            for line in f:
                if line[0]=='v' and line[1]!='n': #vertex
                    tuple_elem=line.split()
                    vertex_list.append((tuple_elem[1],tuple_elem[2],tuple_elem[3]))
                elif line[0]=='v': #vertex normal
                    tuple_elem=line.split()
                    normal_list.append((tuple_elem[1],tuple_elem[2],str(-float(tuple_elem[3]))))
                elif line[0]=='f': #face
                    vertex_index_elem=re.findall(r"[\w']+", line)
                    vertex_index_list.append(vertex_index_elem[1])
                    vertex_index_list.append(vertex_index_elem[3])
                    vertex_index_list.append(vertex_index_elem[5])
                    normal_index_list.append(vertex_index_elem[2])
                    normal_index_list.append(vertex_index_elem[4])
                    normal_index_list.append(vertex_index_elem[6])

        letter_to_geometry[letter]=((vertex_list,vertex_index_list),(normal_list,normal_index_list))

    #print the geometry formatted as an array of arrays in javascript
    vertex_array_string="var geometry_verticies= [\n"
    normal_array_string="var geometry_normals= [\n"


    for letter in list(string.ascii_lowercase)+list(range(10)):
        geometry_tuple=letter_to_geometry[letter]
        vertex_array_string+="[\n"

        for vertex_index in geometry_tuple[0][1]:
            vertex = geometry_tuple[0][0][int(vertex_index)-1]
            vertex_array_string+="\tvec3("+vertex[0]+", "+vertex[1]+", "+vertex[2]+"),\n"
        vertex_array_string = vertex_array_string[:-2]
        vertex_array_string+="\n],"

        normal_array_string+="[\n"
        for normal_index in geometry_tuple[1][1]:
            normal = geometry_tuple[1][0][int(normal_index)-1]
            normal_array_string+="\tvec3("+normal[0]+", "+normal[1]+", "+normal[2]+"),\n"
        normal_array_string = normal_array_string[:-2]
        normal_array_string+="\n],"
    vertex_array_string = vertex_array_string[:-2]
    normal_array_string = normal_array_string[:-2]
    vertex_array_string+="]\n]\n"
    normal_array_string+="]\n]\n"

    if(args.output_file == None):
        print vertex_array_string
        print normal_array_string
    else:
        output_string=vertex_array_string+'\n'+normal_array_string
        with open(args.output_file, 'w') as f:
            f.write(output_string)

if __name__ == "__main__":
    main()
